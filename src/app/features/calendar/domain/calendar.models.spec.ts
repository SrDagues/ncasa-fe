import { describe, expect, it } from 'vitest';
import { calendarRangeForMonth, validateCalendarDraft } from './calendar.models';

describe('calendar domain', () => {
  it('builds a Monday-first range containing the complete month grid', () => {
    expect(calendarRangeForMonth('2026-09')).toEqual({ from: '2026-08-31', to: '2026-10-04' });
  });

  it('rejects recurrence for events', () => {
    expect(validateCalendarDraft({
      kind: 'EVENT', title: 'Cena', timing: { allDay: true, startDate: '2026-09-10', startTime: null, endDate: null, endTime: null },
      color: '#D97963', location: null, note: null, link: null, participantMemberIds: [],
      recurrence: { frequency: 'WEEKLY', endType: 'NEVER', untilDate: null, totalOccurrences: null }, reminders: [],
      reminderRecipientMemberIds: [], specialDateType: null, relatedMemberId: null,
    })).toContain('recurrence');
  });

  it('requires a special-date type', () => {
    expect(validateCalendarDraft({
      kind: 'SPECIAL_DATE', title: 'Aniversario', timing: { allDay: true, startDate: '2026-09-10', startTime: null, endDate: null, endTime: null },
      color: '#D97963', location: null, note: null, link: null, participantMemberIds: [], recurrence: null,
      reminders: [], reminderRecipientMemberIds: [], specialDateType: null, relatedMemberId: null,
    })).toContain('specialDateType');
  });

  it('requires both end date and end time for a timed entry', () => {
    const errors = validateCalendarDraft({
      kind: 'EVENT', title: 'Cena', timing: { allDay: false, startDate: '2026-09-10', startTime: '20:00', endDate: '2026-09-10', endTime: null },
      color: '#D97963', location: null, note: null, link: null, participantMemberIds: [], recurrence: null,
      reminders: [], reminderRecipientMemberIds: [], specialDateType: null, relatedMemberId: null,
    });
    expect(errors).toContain('endTime');
  });

  it('requires the selected recurrence end value', () => {
    const errors = validateCalendarDraft({
      kind: 'TASK', title: 'Compra', timing: { allDay: true, startDate: '2026-09-10', startTime: null, endDate: null, endTime: null },
      color: '#D97963', location: null, note: null, link: null, participantMemberIds: [],
      recurrence: { frequency: 'MONTHLY', endType: 'UNTIL_DATE', untilDate: null, totalOccurrences: null },
      reminders: [], reminderRecipientMemberIds: [], specialDateType: null, relatedMemberId: null,
    });
    expect(errors).toContain('untilDate');
  });
});
