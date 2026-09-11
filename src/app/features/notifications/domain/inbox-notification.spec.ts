import { describe, expect, it } from 'vitest';
import { InboxNotification, NotificationAmount, NotificationDomainError } from './inbox-notification';

const notification = (changes: Partial<ConstructorParameters<typeof InboxNotification>[0]> = {}) => new InboxNotification({
  id: 'n1', kind: 'EXPENSE_PLAN_OCCURRENCE_APPROACHING', householdId: 'h1', planId: 'p1',
  subject: 'Rent', amount: NotificationAmount.fromDecimal('900.00', 'EUR'), occurrenceDate: '2026-09-10',
  occurrenceNumber: 2, totalOccurrences: 12, attentionReason: null,
  occurredAt: '2026-09-04T08:00:00Z', createdAt: '2026-09-04T08:00:01Z', readAt: null, ...changes,
});

describe('InboxNotification', () => {
  it('creates a valid unread reminder and normalizes text and currency', () => {
    const value = notification({ subject: ' Rent ' });
    expect(value.subject).toBe('Rent');
    expect(value.amount!.currency).toBe('EUR');
    expect(value.amount!.minorUnits).toBe(90000n);
    expect(value.isUnread).toBe(true);
  });

  it.each([
    [{ id: ' ' }, 'id'], [{ subject: '' }, 'Subject'], [{ occurrenceNumber: 0 }, 'Occurrence'],
    [{ totalOccurrences: 1 }, 'total'], [{ occurrenceDate: '2025-02-29' }, 'date'],
    [{ occurredAt: 'yesterday' }, 'Occurred'], [{ readAt: '2026-09-04T07:59:59Z' }, 'Read'],
  ] as const)('rejects invalid notification state %#', (changes, message) => {
    expect(() => notification(changes)).toThrow(message);
  });

  it('requires an attention reason only for attention notifications', () => {
    expect(() => notification({ kind: 'EXPENSE_PLAN_ATTENTION_REQUIRED', attentionReason: null })).toThrow('Attention');
    expect(() => notification({ attentionReason: 'unexpected' })).toThrow('Reminder');
    expect(notification({ kind: 'EXPENSE_PLAN_ATTENTION_REQUIRED', attentionReason: ' Fix plan ' }).attentionReason).toBe('Fix plan');
  });

  it('models a completed task without expense installment data', () => {
    const value = notification({ kind: 'CALENDAR_TASK_COMPLETED', planId: null, calendarEntryId: 'task-1',
      amount: null, occurrenceNumber: null, totalOccurrences: null, completedByMemberId: 'member-1' });
    expect(value.calendarEntryId).toBe('task-1');
    expect(value.amount).toBeNull();
  });

  it('marks an unread notification immutably and only once', () => {
    const original = notification();
    const read = original.markRead('2026-09-04T09:00:00Z');
    expect(original.isUnread).toBe(true);
    expect(read.readAt).toBe('2026-09-04T09:00:00Z');
    expect(read.markRead('2026-09-04T10:00:00Z')).toBe(read);
  });
});

describe('NotificationAmount', () => {
  it.each(['0', '-1.00', '1.001', '1000000000000000.00'])('rejects invalid amount %s', value => {
    expect(() => NotificationAmount.fromDecimal(value, 'EUR')).toThrow(NotificationDomainError);
  });
  it('rejects an unknown currency', () => {
    expect(() => NotificationAmount.fromDecimal('1.00', 'ZZZ')).toThrow(NotificationDomainError);
  });
});
