import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { HouseholdStore } from '../../../household';
import { CalendarApplicationError } from '../../application/calendar.errors';
import { CreateCalendarEntryUseCase, GetCalendarEntryUseCase, UpdateCalendarEntryUseCase } from '../../application/use-cases/calendar.use-cases';
import { CalendarEntry, defaultReminderDays, validateCalendarDraft } from '../../domain/calendar.models';
import { buildCalendarDraft, calendarFormDateErrors, displayCalendarDate, parseCalendarDate } from './calendar-form.mapper';

@Component({
  selector: 'app-calendar-entry-form',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, ButtonComponent, CardComponent, IconComponent],
  templateUrl: './calendar-entry-form.component.html',
})
export class CalendarEntryFormComponent {
  protected readonly household = inject(HouseholdStore);
  private readonly create = inject(CreateCalendarEntryUseCase);
  private readonly update = inject(UpdateCalendarEntryUseCase);
  private readonly get = inject(GetCalendarEntryUseCase);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  protected readonly itemId = this.route.snapshot.paramMap.get('itemId');
  protected readonly editing = !!this.itemId;
  protected readonly pending = signal(false);
  protected readonly loadError = signal(false);
  protected readonly validationErrors = signal<readonly string[]>([]);
  protected readonly requestError = signal<CalendarApplicationError | null>(null);
  protected readonly errorKey = computed(() => `calendarForm.errors.${this.requestError()?.kind ?? 'unexpected'}`);
  private loaded: CalendarEntry | null = null;
  private initializedMembers = false;

  protected readonly form = this.fb.nonNullable.group({
    kind: ['TASK', Validators.required], title: ['', [Validators.required, Validators.maxLength(240)]], allDay: [true],
    startDate: [displayCalendarDate(routeDate(this.route) ?? madridDate()), [Validators.required, Validators.pattern(/^\d{2}-\d{2}-\d{4}$/)]], startTime: ['09:00'], hasEnd: [false],
    endDate: ['', Validators.pattern(/^$|^\d{2}-\d{2}-\d{4}$/)], endTime: [''], color: ['#D97963', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    location: ['', Validators.maxLength(240)], note: ['', Validators.maxLength(1000)],
    link: ['', Validators.pattern(/^$|^https?:\/\//i)], recurring: [false], frequency: ['WEEKLY'], endType: ['NEVER'],
    untilDate: ['', Validators.pattern(/^$|^\d{2}-\d{2}-\d{4}$/)], totalOccurrences: [2, [Validators.min(1), Validators.pattern(/^\d+$/)]], specialDateType: ['BIRTHDAY'],
    relatedMemberId: [''], reminderDays: ['1', Validators.pattern(/^\s*$|^\s*\d{1,3}\s*(,\s*\d{1,3}\s*)*$/)],
  });
  protected selectedParticipants = new Set<string>();
  protected selectedRecipients = new Set<string>();

  constructor() {
    effect(() => {
      const household = this.household.active();
      if (!household) return;
      if (this.itemId && !this.loaded) void this.load(household.id, this.itemId);
      if (!this.editing && !this.initializedMembers) {
        const currentMemberId = this.household.households().find(item => item.id === household.id)?.currentMemberId;
        if (currentMemberId) { this.selectedParticipants = new Set([currentMemberId]); this.selectedRecipients = new Set([currentMemberId]); }
        this.initializedMembers = true;
      }
    });
    this.form.controls.kind.valueChanges.subscribe(kind => {
      if (kind === 'EVENT') this.form.controls.recurring.setValue(false);
      if (kind === 'SPECIAL_DATE') {
        this.form.patchValue({ recurring: true, frequency: 'YEARLY', endType: 'NEVER', untilDate: '' });
      }
    });
    this.form.controls.frequency.valueChanges.subscribe(value => this.form.controls.reminderDays.setValue(defaultReminderDays(value as 'WEEKLY' | 'MONTHLY' | 'YEARLY').join(', ')));
  }

  protected toggleParticipant(id: string, checked: boolean): void { this.selectedParticipants = changedSet(this.selectedParticipants, id, checked); }
  protected toggleRecipient(id: string, checked: boolean): void { this.selectedRecipients = changedSet(this.selectedRecipients, id, checked); }
  protected onParticipantChange(id: string, event: Event): void { this.toggleParticipant(id, (event.target as HTMLInputElement).checked); }
  protected onRecipientChange(id: string, event: Event): void { this.toggleRecipient(id, (event.target as HTMLInputElement).checked); }
  protected hasError(field: string): boolean { return this.validationErrors().includes(field); }
  protected pickerValue(value: string): string { return parseCalendarDate(value) ?? ''; }
  protected openDatePicker(picker: HTMLInputElement): void {
    try { picker.showPicker(); } catch { picker.click(); }
  }
  protected applyPickedDate(field: 'startDate' | 'endDate' | 'untilDate', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    this.form.controls[field].setValue(displayCalendarDate(value));
    this.validationErrors.update(errors => errors.filter(error => error !== field));
  }

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched(); this.requestError.set(null);
    const householdId = this.household.active()?.id;
    const draft = buildCalendarDraft(this.form.getRawValue(), [...this.selectedParticipants], [...this.selectedRecipients]);
    const errors = [...validateCalendarDraft(draft), ...calendarFormDateErrors(this.form.getRawValue()), ...formControlErrors(this.form.controls)];
    this.validationErrors.set([...new Set(errors)]);
    if (errors.length || this.pending()) return;
    if (!householdId) {
      this.requestError.set(new CalendarApplicationError('unexpected', 'Household context is unavailable'));
      return;
    }
    this.pending.set(true);
    try {
      const occurrenceKey = this.route.snapshot.queryParamMap.get('occurrenceKey') ?? undefined;
      const result = this.loaded
        ? await firstValueFrom(this.update.execute(householdId, this.loaded.id, this.loaded.version, draft, occurrenceKey))
        : await firstValueFrom(this.create.execute(householdId, draft));
      this.notifications.show({ id: 'calendar-saved', tone: 'positive', message: this.translate.instant('calendar.saved'), durationMs: 4000 });
      await this.router.navigate(['/app/calendar', result.id], { queryParams: occurrenceKey ? { occurrenceKey } : undefined });
    } catch (error) {
      const failure = error instanceof CalendarApplicationError ? error : new CalendarApplicationError('unexpected', 'Unexpected error');
      this.requestError.set(failure);
      this.validationErrors.set(Object.keys(failure.fields).map(field => field.replace(/^entry\.|^timing\./, '')));
    } finally { this.pending.set(false); }
  }

  private async load(householdId: string, itemId: string): Promise<void> {
    try {
      const entry = await firstValueFrom(this.get.execute(householdId, itemId)); this.loaded = entry;
      this.selectedParticipants = new Set(entry.participantMemberIds); this.selectedRecipients = new Set(entry.reminderRecipientMemberIds);
      this.form.patchValue({ kind: entry.kind, title: entry.title, allDay: entry.timing.allDay, startDate: displayCalendarDate(entry.timing.startDate),
        startTime: entry.timing.startTime?.slice(0, 5) ?? '09:00', hasEnd: !!entry.timing.endDate, endDate: displayCalendarDate(entry.timing.endDate),
        endTime: entry.timing.endTime?.slice(0, 5) ?? '', color: entry.color, location: entry.location ?? '', note: entry.note ?? '', link: entry.link ?? '',
        recurring: !!entry.recurrence, frequency: entry.recurrence?.frequency ?? 'WEEKLY', endType: entry.recurrence?.endType ?? 'NEVER',
        untilDate: displayCalendarDate(entry.recurrence?.untilDate ?? null), totalOccurrences: entry.recurrence?.totalOccurrences ?? 2,
        specialDateType: entry.specialDateType ?? 'BIRTHDAY', relatedMemberId: entry.relatedMemberId ?? '',
        reminderDays: entry.reminders.filter(item => item.enabled).map(item => item.daysBefore).join(', ') });
    } catch { this.loadError.set(true); }
  }
}

const changedSet = (source: ReadonlySet<string>, id: string, checked: boolean): Set<string> => { const next = new Set(source); checked ? next.add(id) : next.delete(id); return next; };
const routeDate = (route: ActivatedRoute): string | null => { const value = route.snapshot.queryParamMap.get('date'); return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null; };
const madridDate = (): string => { const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()); const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? ''; return `${get('year')}-${get('month')}-${get('day')}`; };
const formControlErrors = (controls: Readonly<Record<string, { readonly invalid: boolean }>>): readonly string[] => Object.entries(controls).filter(([, control]) => control.invalid).map(([field]) => field === 'reminderDays' ? 'reminders' : field);
