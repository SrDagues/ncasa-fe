import { CalendarDraft, CalendarKind, RecurrenceEndType, RecurrenceFrequency, SpecialDateType } from '../../domain/calendar.models';

export interface CalendarFormValue {
  readonly kind: string; readonly title: string; readonly allDay: boolean; readonly startDate: string; readonly startTime: string;
  readonly hasEnd: boolean; readonly endDate: string; readonly endTime: string; readonly color: string; readonly location: string;
  readonly note: string; readonly link: string; readonly recurring: boolean; readonly frequency: string; readonly endType: string;
  readonly untilDate: string; readonly totalOccurrences: number; readonly specialDateType: string; readonly relatedMemberId: string;
  readonly reminderDays: string;
}

export function parseCalendarDate(value: string): string | null {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() + 1 !== Number(month) || date.getUTCDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
}

export function displayCalendarDate(isoDate: string | null): string {
  if (!isoDate) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}

export function calendarFormDateErrors(value: CalendarFormValue): readonly string[] {
  const errors: string[] = [];
  if (!parseCalendarDate(value.startDate)) errors.push('startDate');
  if (value.hasEnd && !parseCalendarDate(value.endDate)) errors.push('endDate');
  if (value.recurring && value.endType === 'UNTIL_DATE' && !parseCalendarDate(value.untilDate)) errors.push('untilDate');
  return errors;
}

export function buildCalendarDraft(value: CalendarFormValue, participants: readonly string[], recipients: readonly string[]): CalendarDraft {
  const kind = value.kind as CalendarKind;
  const nullable = (text: string): string | null => text.trim() || null;
  const reminderDays = value.reminderDays.trim() === '' ? [] : value.reminderDays.split(',')
    .map(item => Number(item.trim())).filter(Number.isFinite).filter((item, index, all) => all.indexOf(item) === index);
  return {
    kind, title: value.title.trim(),
    timing: { allDay: value.allDay, startDate: parseCalendarDate(value.startDate) ?? '', startTime: value.allDay ? null : value.startTime,
      endDate: value.hasEnd ? parseCalendarDate(value.endDate) ?? '' : null, endTime: value.hasEnd && !value.allDay ? nullable(value.endTime) : null },
    color: value.color, location: nullable(value.location), note: nullable(value.note), link: nullable(value.link),
    participantMemberIds: [...participants],
    recurrence: value.recurring && kind !== 'EVENT' ? { frequency: value.frequency as RecurrenceFrequency,
      endType: value.endType as RecurrenceEndType, untilDate: value.endType === 'UNTIL_DATE' ? parseCalendarDate(value.untilDate) : null,
      totalOccurrences: value.endType === 'AFTER_OCCURRENCES' ? value.totalOccurrences : null } : null,
    reminders: reminderDays.map(daysBefore => ({ daysBefore, enabled: true })), reminderRecipientMemberIds: [...recipients],
    specialDateType: kind === 'SPECIAL_DATE' ? value.specialDateType as SpecialDateType : null,
    relatedMemberId: kind === 'SPECIAL_DATE' ? nullable(value.relatedMemberId) : null,
  };
}
