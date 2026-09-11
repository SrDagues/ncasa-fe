import { describe, expect, it } from 'vitest';
import { mapInboxNotification, mapNotificationPage, mapUnreadCount } from './notification-api.mapper';

export const notificationResponse = {
  id: 'n1', kind: 'EXPENSE_PLAN_OCCURRENCE_APPROACHING', householdId: 'h1', planId: 'p1', subject: 'Rent',
  amount: '900.00', currency: 'EUR', occurrenceDate: '2026-09-10', occurrenceNumber: 2, totalOccurrences: 12,
  calendarEntryId: null, completedByMemberId: null, attentionReason: null,
  occurredAt: '2026-09-04T08:00:00Z', createdAt: '2026-09-04T08:00:01Z', readAt: null,
};

describe('notification API mapper', () => {
  it.each([
    'EXPENSE_PLAN_OCCURRENCE_APPROACHING', 'EXPENSE_PLAN_LAST_INSTALLMENT_APPROACHING', 'EXPENSE_PLAN_ATTENTION_REQUIRED',
  ])('maps %s without leaking its DTO', kind => {
    const value = mapInboxNotification({ ...notificationResponse, kind,
      attentionReason: kind === 'EXPENSE_PLAN_ATTENTION_REQUIRED' ? 'Plan needs a payer' : null });
    expect(value.kind).toBe(kind); expect(value.amount!.minorUnits).toBe(90000n);
  });

  it('maps a calendar task completion without expense data', () => {
    const value = mapInboxNotification({ ...notificationResponse, kind: 'CALENDAR_TASK_COMPLETED', planId: null,
      calendarEntryId: 'task-1', amount: null, currency: null, occurrenceNumber: null,
      totalOccurrences: null, completedByMemberId: 'member-1' });
    expect(value.kind).toBe('CALENDAR_TASK_COMPLETED');
    expect(value.calendarEntryId).toBe('task-1');
    expect(value.amount).toBeNull();
  });

  it.each([
    { kind: 'UNKNOWN' }, { amount: 'zero' }, { occurrenceDate: '2026-02-30' }, { readAt: 3 },
    { attentionReason: 'not allowed' },
  ])('rejects malformed notification payload %#', change => {
    expect(() => mapInboxNotification({ ...notificationResponse, ...change })).toThrow('Invalid notification response');
  });

  it('maps an empty last page', () => {
    expect(mapNotificationPage({ items: [], page: 2, size: 20, totalElements: 40, totalPages: 2 })).toMatchObject({ items: [], page: 2 });
  });

  it.each([-1, 1.5])('rejects invalid unread count %s', unreadCount => {
    expect(() => mapUnreadCount({ unreadCount })).toThrow('Invalid notification response');
  });
});
