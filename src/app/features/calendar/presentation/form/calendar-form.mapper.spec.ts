import { describe, expect, it } from 'vitest';
import { buildCalendarDraft, CalendarFormValue, displayCalendarDate, parseCalendarDate } from './calendar-form.mapper';

describe('calendar form mapper', () => {
  it('disables reminders when the field is empty', () => {
    expect(buildCalendarDraft(value({ reminderDays: '' }), [], []).reminders).toEqual([]);
  });

  it('removes recurrence and special-date data from an event', () => {
    const draft = buildCalendarDraft(value({ kind: 'EVENT', recurring: true, relatedMemberId: 'm2' }), ['m1'], ['m1']);
    expect(draft.recurrence).toBeNull();
    expect(draft.specialDateType).toBeNull();
    expect(draft.relatedMemberId).toBeNull();
  });

  it('normalizes repeated reminder days and keeps zero as today', () => {
    expect(buildCalendarDraft(value({ reminderDays: '7, 2, 7, 0' }), [], []).reminders).toEqual([
      { daysBefore: 7, enabled: true }, { daysBefore: 2, enabled: true }, { daysBefore: 0, enabled: true },
    ]);
  });

  it('converts day-month-year fields to the ISO contract', () => {
    const draft = buildCalendarDraft(value({ startDate: '10-09-2026', hasEnd: true, endDate: '12-09-2026',
      recurring: true, endType: 'UNTIL_DATE', untilDate: '31-12-2026' }), [], []);
    expect(draft.timing.startDate).toBe('2026-09-10');
    expect(draft.timing.endDate).toBe('2026-09-12');
    expect(draft.recurrence?.untilDate).toBe('2026-12-31');
  });

  it('rejects impossible dates instead of normalizing them', () => {
    expect(parseCalendarDate('31-02-2026')).toBeNull();
    expect(buildCalendarDraft(value({ startDate: '31-02-2026' }), [], []).timing.startDate).toBe('');
  });

  it('formats ISO dates for editing as day-month-year', () => {
    expect(displayCalendarDate('2026-09-05')).toBe('05-09-2026');
  });

  it('builds an indefinite yearly recurrence for a recurring birthday', () => {
    const draft = buildCalendarDraft(value({ kind: 'SPECIAL_DATE', specialDateType: 'BIRTHDAY', recurring: true,
      frequency: 'YEARLY', endType: 'NEVER' }), [], []);
    expect(draft.recurrence).toEqual({ frequency: 'YEARLY', endType: 'NEVER', untilDate: null, totalOccurrences: null });
  });
});

const value = (overrides: Partial<CalendarFormValue>): CalendarFormValue => ({
  kind: 'TASK', title: 'Comprar', allDay: true, startDate: '10-09-2026', startTime: '09:00', hasEnd: false,
  endDate: '', endTime: '', color: '#D97963', location: '', note: '', link: '', recurring: false,
  frequency: 'WEEKLY', endType: 'NEVER', untilDate: '', totalOccurrences: 2, specialDateType: 'BIRTHDAY',
  relatedMemberId: '', reminderDays: '1', ...overrides,
});
