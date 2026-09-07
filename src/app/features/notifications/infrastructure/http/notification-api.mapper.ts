import { NotificationApplicationError } from '../../application/notification.errors';
import { NotificationPage } from '../../application/notification.models';
import { InboxNotification, NOTIFICATION_KINDS, NotificationAmount, NotificationKind } from '../../domain/inbox-notification';

type Json = Readonly<Record<string, unknown>>;
const invalid = (): never => { throw new NotificationApplicationError('unexpected', 'Invalid notification response'); };
const object = (value: unknown): Json => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Json : invalid();
const string = (value: unknown): string => typeof value === 'string' ? value : invalid();
const integer = (value: unknown): number => typeof value === 'number' && Number.isInteger(value) ? value : invalid();
const nullableString = (value: unknown): string | null => value === null ? null : string(value);
const nullableInteger = (value: unknown): number | null => value === null ? null : integer(value);

export function mapInboxNotification(value: unknown): InboxNotification {
  try {
    const dto = object(value);
    const rawKind = string(dto['kind']);
    if (!NOTIFICATION_KINDS.includes(rawKind as NotificationKind)) return invalid();
    return new InboxNotification({
      id: string(dto['id']), kind: rawKind as NotificationKind,
      householdId: string(dto['householdId']), planId: string(dto['planId']), subject: string(dto['subject']),
      amount: NotificationAmount.fromDecimal(string(dto['amount']), string(dto['currency'])),
      occurrenceDate: string(dto['occurrenceDate']), occurrenceNumber: integer(dto['occurrenceNumber']),
      totalOccurrences: nullableInteger(dto['totalOccurrences']), attentionReason: nullableString(dto['attentionReason']),
      occurredAt: string(dto['occurredAt']), createdAt: string(dto['createdAt']), readAt: nullableString(dto['readAt']),
    });
  } catch (error) {
    if (error instanceof NotificationApplicationError) throw error;
    return invalid();
  }
}

export function mapNotificationPage(value: unknown): NotificationPage {
  const dto = object(value); const rawItems = dto['items'];
  if (!Array.isArray(rawItems)) return invalid();
  const page = integer(dto['page']); const size = integer(dto['size']);
  const totalElements = integer(dto['totalElements']); const totalPages = integer(dto['totalPages']);
  if (page < 0 || size < 1 || size > 50 || totalElements < 0 || totalPages < 0 || rawItems.length > size) return invalid();
  return { items: rawItems.map(mapInboxNotification), page, size, totalElements, totalPages };
}

export function mapUnreadCount(value: unknown): number {
  const unreadCount = integer(object(value)['unreadCount']);
  return unreadCount >= 0 ? unreadCount : invalid();
}
