export const NOTIFICATION_KINDS = [
  'EXPENSE_PLAN_OCCURRENCE_APPROACHING',
  'EXPENSE_PLAN_LAST_INSTALLMENT_APPROACHING',
  'EXPENSE_PLAN_ATTENTION_REQUIRED',
] as const;

export type NotificationKind = typeof NOTIFICATION_KINDS[number];

export class NotificationDomainError extends Error {}

export class NotificationAmount {
  private constructor(
    readonly minorUnits: bigint,
    readonly currency: string,
    readonly fractionDigits: number,
  ) {}

  static fromDecimal(value: string, currency: string): NotificationAmount {
    const normalizedCurrency = currency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) throw new NotificationDomainError('Invalid currency');
    const fractionDigits = currencyFractionDigits(normalizedCurrency);
    const match = value.trim().match(/^(\d+)(?:\.(\d+))?$/);
    if (!match) throw new NotificationDomainError('Invalid notification amount');
    const decimals = match[2] ?? '';
    if (decimals.length > fractionDigits) throw new NotificationDomainError('Too many fraction digits');
    if (match[1].replace(/^0+/, '').length > 15) throw new NotificationDomainError('Amount exceeds supported precision');
    const minorUnits = BigInt(match[1]) * 10n ** BigInt(fractionDigits)
      + BigInt(decimals.padEnd(fractionDigits, '0') || '0');
    if (minorUnits <= 0n) throw new NotificationDomainError('Notification amount must be positive');
    return new NotificationAmount(minorUnits, normalizedCurrency, fractionDigits);
  }
}

export interface InboxNotificationInput {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly householdId: string;
  readonly planId: string;
  readonly subject: string;
  readonly amount: NotificationAmount;
  readonly occurrenceDate: string;
  readonly occurrenceNumber: number;
  readonly totalOccurrences: number | null;
  readonly attentionReason: string | null;
  readonly occurredAt: string;
  readonly createdAt: string;
  readonly readAt: string | null;
}

export class InboxNotification {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly householdId: string;
  readonly planId: string;
  readonly subject: string;
  readonly amount: NotificationAmount;
  readonly occurrenceDate: string;
  readonly occurrenceNumber: number;
  readonly totalOccurrences: number | null;
  readonly attentionReason: string | null;
  readonly occurredAt: string;
  readonly createdAt: string;
  readonly readAt: string | null;

  constructor(input: InboxNotificationInput) {
    this.id = required(input.id, 100, 'Notification id');
    this.kind = input.kind;
    if (!NOTIFICATION_KINDS.includes(this.kind)) throw new NotificationDomainError('Unknown notification kind');
    this.householdId = required(input.householdId, 100, 'Household id');
    this.planId = required(input.planId, 100, 'Plan id');
    this.subject = required(input.subject, 240, 'Subject');
    this.amount = input.amount;
    this.occurrenceDate = validLocalDate(input.occurrenceDate);
    if (!Number.isInteger(input.occurrenceNumber) || input.occurrenceNumber <= 0) {
      throw new NotificationDomainError('Occurrence number must be positive');
    }
    if (input.totalOccurrences !== null && (!Number.isInteger(input.totalOccurrences)
      || input.totalOccurrences < input.occurrenceNumber)) {
      throw new NotificationDomainError('Invalid total occurrences');
    }
    this.occurrenceNumber = input.occurrenceNumber;
    this.totalOccurrences = input.totalOccurrences;
    if (this.kind === 'EXPENSE_PLAN_ATTENTION_REQUIRED') {
      this.attentionReason = required(input.attentionReason, 500, 'Attention reason');
    } else {
      if (input.attentionReason !== null && input.attentionReason.trim() !== '') {
        throw new NotificationDomainError('Reminder cannot contain an attention reason');
      }
      this.attentionReason = null;
    }
    this.occurredAt = validInstant(input.occurredAt, 'Occurred at');
    this.createdAt = validInstant(input.createdAt, 'Created at');
    if (Date.parse(this.occurredAt) > Date.parse(this.createdAt)) {
      throw new NotificationDomainError('Event cannot occur after notification creation');
    }
    this.readAt = input.readAt === null ? null : validInstant(input.readAt, 'Read at');
    if (this.readAt !== null && Date.parse(this.readAt) < Date.parse(this.createdAt)) {
      throw new NotificationDomainError('Read time cannot precede creation');
    }
  }

  get isUnread(): boolean { return this.readAt === null; }

  markRead(readAt: string): InboxNotification {
    if (!this.isUnread) return this;
    return new InboxNotification({ ...this, readAt });
  }
}

const required = (value: string | null, max: number, field: string): string => {
  const normalized = value?.trim() ?? '';
  if (!normalized || normalized.length > max) throw new NotificationDomainError(`Invalid ${field}`);
  return normalized;
};

const validInstant = (value: string, field: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    || !Number.isFinite(Date.parse(value))) throw new NotificationDomainError(`Invalid ${field}`);
  return value;
};

const validLocalDate = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new NotificationDomainError('Invalid occurrence date');
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new NotificationDomainError('Invalid occurrence date');
  }
  return value;
};

const currencyFractionDigits = (currency: string): number => {
  try {
    const formatter = new Intl.NumberFormat('en', { style: 'currency', currency });
    const digits = formatter.resolvedOptions().maximumFractionDigits;
    const supported = typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('currency').includes(currency)
      : formatter.formatToParts(1).some(part => part.type === 'currency' && part.value !== currency);
    if (!supported || digits === undefined || digits < 0 || digits > 4) throw new NotificationDomainError('Unsupported currency');
    return digits;
  } catch (error) {
    if (error instanceof NotificationDomainError) throw error;
    throw new NotificationDomainError('Unknown currency');
  }
};
