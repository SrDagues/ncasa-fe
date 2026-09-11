import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import es from '../../../../../../public/i18n/es.json';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { HouseholdStore } from '../../../household';
import { CreateCalendarEntryUseCase, GetCalendarEntryUseCase, UpdateCalendarEntryUseCase } from '../../application/use-cases/calendar.use-cases';
import { CalendarEntry } from '../../domain/calendar.models';
import { CalendarEntryFormComponent } from './calendar-entry-form.component';

const members = [{ id: 'm1', accountId: 1, email: 'one@example.com', role: 'ADMIN' as const, status: 'ACTIVE' as const,
  owner: true, joinedAt: '', statusChangedAt: '' }];
const household = { id: 'h1', name: 'Casa', status: 'ACTIVE' as const, ownerMemberId: 'm1', createdBy: 1, createdAt: '', members };
const entry: CalendarEntry = { id: 'i1', seriesId: 'i1', householdId: 'h1', kind: 'TASK', title: 'Comprar pan',
  timing: { allDay: true, startDate: '2026-09-15', startTime: null, endDate: null, endTime: null }, color: '#d97963',
  location: null, note: null, link: null, participantMemberIds: ['m1'], recurrence: null,
  reminders: [{ daysBefore: 1, enabled: true }], reminderRecipientMemberIds: ['m1'], specialDateType: null,
  relatedMemberId: null, createdByMemberId: 'm1', deletedAt: null, version: 0 };

describe('CalendarEntryFormComponent', () => {
  const active = signal<typeof household | null>(household);
  const create = vi.fn(() => of(entry));

  beforeEach(() => {
    vi.clearAllMocks(); active.set(household);
    TestBed.configureTestingModule({ imports: [CalendarEntryFormComponent], providers: [
      provideRouter([]), provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({ date: '2026-09-15' }) } } },
      { provide: HouseholdStore, useValue: { active, members: signal(members), households: signal([
        { id: 'h1', name: 'Casa', status: 'ACTIVE', currentMemberId: 'm1', currentRole: 'ADMIN', owner: true },
      ]) } },
      { provide: CreateCalendarEntryUseCase, useValue: { execute: create } },
      { provide: UpdateCalendarEntryUseCase, useValue: { execute: vi.fn() } },
      { provide: GetCalendarEntryUseCase, useValue: { execute: vi.fn() } },
      { provide: NotificationService, useValue: { show: vi.fn() } },
    ] });
    TestBed.inject(TranslateService).setTranslation('es', es);
  });

  it('creates an all-day task with only its title and selected date', async () => {
    const fixture = TestBed.createComponent(CalendarEntryFormComponent); fixture.detectChanges();
    const dateInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#calendar-start-date');
    expect(dateInput?.type).toBe('text');
    expect(dateInput?.placeholder).toBe('DD-MM-AAAA');
    expect(dateInput?.value).toBe('15-09-2026');
    fill(fixture.nativeElement, '#calendar-title', 'Comprar pan');
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    await fixture.whenStable();
    expect(create).toHaveBeenCalledWith('h1', expect.objectContaining({ title: 'Comprar pan', kind: 'TASK',
      timing: expect.objectContaining({ allDay: true, startDate: '2026-09-15' }) }));
  });

  it('opens a calendar from the formatted field and applies the selected date', () => {
    const fixture = TestBed.createComponent(CalendarEntryFormComponent); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const visible = root.querySelector<HTMLInputElement>('#calendar-start-date')!;
    const picker = root.querySelector<HTMLInputElement>('#calendar-start-date-picker')!;
    const showPicker = vi.fn(); picker.showPicker = showPicker;

    visible.click();
    expect(showPicker).toHaveBeenCalledOnce();

    picker.value = '2026-10-03'; picker.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(visible.value).toBe('03-10-2026');
  });

  it('defaults birthdays to an indefinite yearly recurrence', () => {
    const fixture = TestBed.createComponent(CalendarEntryFormComponent); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const specialDate = root.querySelector<HTMLInputElement>('input[value="SPECIAL_DATE"]')!;
    specialDate.click(); fixture.detectChanges();

    expect(root.querySelector<HTMLInputElement>('input[formcontrolname="recurring"]')?.checked).toBe(true);
    expect(root.querySelector<HTMLSelectElement>('#calendar-frequency')?.value).toBe('YEARLY');
    expect(root.querySelector<HTMLSelectElement>('#calendar-end-type')?.value).toBe('NEVER');
  });

  it('disables submit and explains why when the household context is unavailable', async () => {
    active.set(null);
    const fixture = TestBed.createComponent(CalendarEntryFormComponent); fixture.detectChanges();
    fill(fixture.nativeElement, '#calendar-title', 'Comprar pan');
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(create).not.toHaveBeenCalled();
    expect(button?.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('Preparando el hogar');
  });
});

function fill(root: HTMLElement, selector: string, value: string): void {
  const input = root.querySelector<HTMLInputElement>(selector); if (!input) throw new Error(`Missing ${selector}`);
  input.value = value; input.dispatchEvent(new Event('input'));
}
