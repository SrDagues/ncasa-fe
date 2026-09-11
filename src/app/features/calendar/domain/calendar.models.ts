export type CalendarKind = 'TASK' | 'EVENT' | 'SPECIAL_DATE';
export type CalendarStatus = 'PENDING' | 'COMPLETED';
export type RecurrenceFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type RecurrenceEndType = 'NEVER' | 'UNTIL_DATE' | 'AFTER_OCCURRENCES';
export type SpecialDateType = 'BIRTHDAY' | 'ANNIVERSARY' | 'CUSTOM';

export interface CalendarTiming {
  readonly allDay: boolean;
  readonly startDate: string;
  readonly startTime: string | null;
  readonly endDate: string | null;
  readonly endTime: string | null;
}

export interface CalendarRecurrence {
  readonly frequency: RecurrenceFrequency;
  readonly endType: RecurrenceEndType;
  readonly untilDate: string | null;
  readonly totalOccurrences: number | null;
}

export interface CalendarReminder { readonly daysBefore: number; readonly enabled: boolean; }

export interface CalendarDraft {
  readonly kind: CalendarKind;
  readonly title: string;
  readonly timing: CalendarTiming;
  readonly color: string;
  readonly location: string | null;
  readonly note: string | null;
  readonly link: string | null;
  readonly participantMemberIds: readonly string[];
  readonly recurrence: CalendarRecurrence | null;
  readonly reminders: readonly CalendarReminder[];
  readonly reminderRecipientMemberIds: readonly string[];
  readonly specialDateType: SpecialDateType | null;
  readonly relatedMemberId: string | null;
}

export interface CalendarEntry extends CalendarDraft {
  readonly id: string;
  readonly seriesId: string | null;
  readonly householdId: string;
  readonly createdByMemberId: string;
  readonly deletedAt: string | null;
  readonly version: number;
}

export interface CalendarOccurrence {
  readonly itemId: string;
  readonly occurrenceKey: string;
  readonly kind: CalendarKind;
  readonly title: string;
  readonly timing: CalendarTiming;
  readonly color: string;
  readonly status: CalendarStatus;
  readonly recurring: boolean;
}

export function validateCalendarDraft(draft: CalendarDraft): readonly string[] {
  const errors: string[] = [];
  if (!draft.title.trim() || draft.title.trim().length > 240) errors.push('title');
  if (!/^#[0-9A-Fa-f]{6}$/.test(draft.color)) errors.push('color');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.timing.startDate)) errors.push('startDate');
  if (!draft.timing.allDay && !draft.timing.startTime) errors.push('startTime');
  if (draft.timing.endDate && draft.timing.endDate < draft.timing.startDate) errors.push('endDate');
  if (!draft.timing.allDay && draft.timing.endDate && !draft.timing.endTime) errors.push('endTime');
  if (!draft.timing.allDay && !draft.timing.endDate && draft.timing.endTime) errors.push('endDate');
  if (!draft.timing.allDay && draft.timing.endDate && draft.timing.endTime
      && `${draft.timing.endDate}T${draft.timing.endTime}` < `${draft.timing.startDate}T${draft.timing.startTime}`) errors.push('endTime');
  if (draft.kind === 'EVENT' && draft.recurrence) errors.push('recurrence');
  if (draft.recurrence?.endType === 'UNTIL_DATE' && !draft.recurrence.untilDate) errors.push('untilDate');
  if (draft.recurrence?.endType === 'UNTIL_DATE' && draft.recurrence.untilDate && draft.recurrence.untilDate < draft.timing.startDate) errors.push('untilDate');
  if (draft.recurrence?.endType === 'AFTER_OCCURRENCES' && (!Number.isInteger(draft.recurrence.totalOccurrences) || (draft.recurrence.totalOccurrences ?? 0) < 1)) errors.push('totalOccurrences');
  if (draft.kind === 'SPECIAL_DATE' && !draft.specialDateType) errors.push('specialDateType');
  if (draft.kind !== 'SPECIAL_DATE' && (draft.specialDateType || draft.relatedMemberId)) errors.push('specialDate');
  if (draft.link && !/^https?:\/\//i.test(draft.link)) errors.push('link');
  if (draft.reminders.some(item => !Number.isInteger(item.daysBefore) || item.daysBefore < 0 || item.daysBefore > 366)) errors.push('reminders');
  return errors;
}

export function calendarRangeForMonth(month: string): { readonly from: string; readonly to: string } {
  const [year, monthNumber] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const last = new Date(Date.UTC(year, monthNumber, 0));
  const from = new Date(first); from.setUTCDate(first.getUTCDate() - ((first.getUTCDay() + 6) % 7));
  const to = new Date(last); to.setUTCDate(last.getUTCDate() + ((7 - last.getUTCDay()) % 7));
  return { from: iso(from), to: iso(to) };
}

export const defaultReminderDays = (frequency: RecurrenceFrequency | null): readonly number[] =>
  frequency === 'WEEKLY' ? [1] : frequency === 'MONTHLY' ? [7, 2] : frequency === 'YEARLY' ? [14, 7] : [1];

const iso = (date: Date): string => date.toISOString().slice(0, 10);
