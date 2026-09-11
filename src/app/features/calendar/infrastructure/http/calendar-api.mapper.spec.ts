import { describe, expect, it } from 'vitest';
import { CalendarApplicationError } from '../../application/calendar.errors';
import { mapCalendarEntry, mapCalendarOccurrences } from './calendar-api.mapper';

const timing = { allDay: true, startDate: '2026-09-10', startTime: null, endDate: null, endTime: null };

describe('calendar API mapper', () => {
  it('maps an occurrence without leaking its DTO', () => {
    expect(mapCalendarOccurrences([{ itemId: 'i1', occurrenceKey: '2026-09-10', kind: 'TASK', title: 'Comprar', timing, color: '#112233', status: 'PENDING', recurring: true }])[0])
      .toEqual({ itemId: 'i1', occurrenceKey: '2026-09-10', kind: 'TASK', title: 'Comprar', timing, color: '#112233', status: 'PENDING', recurring: true });
  });

  it('rejects malformed enum values', () => {
    expect(() => mapCalendarOccurrences([{ itemId: 'i1', occurrenceKey: 'x', kind: 'OTHER' }])).toThrow(CalendarApplicationError);
  });

  it('maps nullable entry fields', () => {
    const result = mapCalendarEntry({ id: 'i1', seriesId: null, householdId: 'h1', kind: 'EVENT', title: 'Cena', timing, color: '#112233', location: null, note: null, link: null, participantMemberIds: [], recurrence: null, reminders: [], reminderRecipientMemberIds: [], specialDateType: null, relatedMemberId: null, createdByMemberId: 'm1', deletedAt: null, version: 2 });
    expect(result.version).toBe(2);
    expect(result.recurrence).toBeNull();
  });
});
