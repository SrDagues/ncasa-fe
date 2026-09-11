import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { HouseholdStore } from '../../../household';
import { CompleteCalendarOccurrenceUseCase, GetCalendarEntryUseCase, ListCalendarOccurrencesUseCase, TrashCalendarEntryUseCase } from '../../application/use-cases/calendar.use-cases';
import { CalendarEntry } from '../../domain/calendar.models';
import { formatCalendarDate } from '../month/calendar-month.view-model';

@Component({ selector: 'app-calendar-entry-detail', standalone: true, imports: [RouterLink, TranslatePipe, ButtonComponent, CardComponent], templateUrl: './calendar-entry-detail.component.html' })
export class CalendarEntryDetailComponent {
  private readonly household = inject(HouseholdStore); private readonly get = inject(GetCalendarEntryUseCase); private readonly list = inject(ListCalendarOccurrencesUseCase); private readonly trashUseCase = inject(TrashCalendarEntryUseCase); private readonly completeUseCase = inject(CompleteCalendarOccurrenceUseCase); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); private readonly confirm = inject(ConfirmDialogService); private readonly notifications = inject(NotificationService); private readonly translate = inject(TranslateService);
  protected readonly entry = signal<CalendarEntry | null>(null); protected readonly state = signal<'loading' | 'ready' | 'error'>('loading'); protected readonly pending = signal(false); protected readonly completed = signal(false); protected readonly itemId = this.route.snapshot.paramMap.get('itemId') ?? ''; protected readonly occurrenceKey = this.route.snapshot.queryParamMap.get('occurrenceKey');
  constructor() { effect(() => { const id = this.household.active()?.id; if (id) void this.load(id); }); }
  protected async setCompleted(value: boolean): Promise<void> { const householdId = this.household.active()?.id; const entry = this.entry(); if (!householdId || !entry || !this.occurrenceKey || this.pending()) return; this.pending.set(true); try { const updated = await firstValueFrom(this.completeUseCase.execute(householdId, entry.id, this.occurrenceKey, entry.version, value)); this.entry.set(updated); this.completed.set(value); } catch { this.notifyError(); } finally { this.pending.set(false); } }
  protected async moveToTrash(): Promise<void> { const entry = this.entry(); const householdId = this.household.active()?.id; if (!entry || !householdId || this.pending()) return; const accepted = await this.confirm.open({ title: this.translate.instant('calendar.deleteTitle'), message: this.translate.instant(entry.recurrence && this.occurrenceKey ? 'calendar.deleteFollowingMessage' : 'calendar.deleteMessage'), confirmLabel: this.translate.instant('calendar.moveToTrash'), cancelLabel: this.translate.instant('common.cancel'), variant: 'destructive' }); if (!accepted) return; this.pending.set(true); try { await firstValueFrom(this.trashUseCase.execute(householdId, entry.id, entry.version, entry.recurrence ? this.occurrenceKey ?? undefined : undefined)); this.notifications.show({ id: 'calendar-trashed', tone: 'positive', message: this.translate.instant('calendar.trashed'), durationMs: 4000 }); await this.router.navigate(['/app/calendar']); } catch { this.notifyError(); } finally { this.pending.set(false); } }
  protected memberName(id: string): string { return this.household.members().find(member => member.id === id)?.email ?? id; }
  protected participantNames(ids: readonly string[]): string { return ids.map(id => this.memberName(id)).join(', '); }
  protected typeKey(kind: string): string { return `calendar.kinds.${kind.toLowerCase()}`; }
  protected displayTime(value: string | null): string { return value?.slice(0, 5) ?? ''; }
  protected displayDate(value: string): string { return formatCalendarDate(value); }
  private async load(householdId: string): Promise<void> { this.state.set('loading'); try { const entryPromise = firstValueFrom(this.get.execute(householdId, this.itemId)); const occurrencePromise = this.occurrenceKey ? firstValueFrom(this.list.execute(householdId, this.occurrenceKey.slice(0, 10), this.occurrenceKey.slice(0, 10))) : Promise.resolve([]); const [entry, occurrences] = await Promise.all([entryPromise, occurrencePromise]); this.entry.set(entry); this.completed.set(occurrences.find(item => item.itemId === entry.id && item.occurrenceKey === this.occurrenceKey)?.status === 'COMPLETED'); this.state.set('ready'); } catch { this.state.set('error'); } }
  private notifyError(): void { this.notifications.show({ id: 'calendar-error', tone: 'error', message: this.translate.instant('calendar.actionError'), durationMs: 5000 }); }
}
