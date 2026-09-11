import { CalendarApplicationError } from '../../application/calendar.errors';
import { CalendarEntry, CalendarKind, CalendarOccurrence, CalendarRecurrence, CalendarReminder, CalendarStatus, CalendarTiming, RecurrenceEndType, RecurrenceFrequency, SpecialDateType } from '../../domain/calendar.models';

type Json = Readonly<Record<string, unknown>>;
const invalid = (): never => { throw new CalendarApplicationError('unexpected', 'Invalid calendar response'); };
const object = (value: unknown): Json => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Json : invalid();
const string = (value: unknown): string => typeof value === 'string' ? value : invalid();
const bool = (value: unknown): boolean => typeof value === 'boolean' ? value : invalid();
const number = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) ? value : invalid();
const nullableString = (value: unknown): string | null => value === null || value === undefined ? null : string(value);
const array = (value: unknown): readonly unknown[] => Array.isArray(value) ? value : invalid();
const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): T => { const found = string(value) as T; return allowed.includes(found) ? found : invalid(); };

const kind = (value: unknown): CalendarKind => oneOf(value, ['TASK', 'EVENT', 'SPECIAL_DATE']);
const status = (value: unknown): CalendarStatus => oneOf(value, ['PENDING', 'COMPLETED']);
const timing = (value: unknown): CalendarTiming => { const dto = object(value); return { allDay: bool(dto['allDay']), startDate: string(dto['startDate']), startTime: nullableString(dto['startTime']), endDate: nullableString(dto['endDate']), endTime: nullableString(dto['endTime']) }; };
const reminders = (value: unknown): readonly CalendarReminder[] => array(value).map(item => { const dto = object(item); return { daysBefore: number(dto['daysBefore']), enabled: bool(dto['enabled']) }; });
const recurrence = (value: unknown): CalendarRecurrence | null => { if (value === null || value === undefined) return null; const dto = object(value); return { frequency: oneOf<RecurrenceFrequency>(dto['frequency'], ['WEEKLY', 'MONTHLY', 'YEARLY']), endType: oneOf<RecurrenceEndType>(dto['endType'], ['NEVER', 'UNTIL_DATE', 'AFTER_OCCURRENCES']), untilDate: nullableString(dto['untilDate']), totalOccurrences: dto['totalOccurrences'] === null || dto['totalOccurrences'] === undefined ? null : number(dto['totalOccurrences']) }; };

export function mapCalendarEntry(value: unknown): CalendarEntry {
  const dto = object(value);
  return { id: string(dto['id']), seriesId: nullableString(dto['seriesId']), householdId: string(dto['householdId']), kind: kind(dto['kind']), title: string(dto['title']), timing: timing(dto['timing']), color: string(dto['color']), location: nullableString(dto['location']), note: nullableString(dto['note']), link: nullableString(dto['link']), participantMemberIds: array(dto['participantMemberIds']).map(string), recurrence: recurrence(dto['recurrence']), reminders: reminders(dto['reminders']), reminderRecipientMemberIds: array(dto['reminderRecipientMemberIds']).map(string), specialDateType: dto['specialDateType'] === null || dto['specialDateType'] === undefined ? null : oneOf<SpecialDateType>(dto['specialDateType'], ['BIRTHDAY', 'ANNIVERSARY', 'CUSTOM']), relatedMemberId: nullableString(dto['relatedMemberId']), createdByMemberId: string(dto['createdByMemberId']), deletedAt: nullableString(dto['deletedAt']), version: number(dto['version']) };
}

export function mapCalendarOccurrences(value: unknown): readonly CalendarOccurrence[] {
  return array(value).map(item => { const dto = object(item); return { itemId: string(dto['itemId']), occurrenceKey: string(dto['occurrenceKey']), kind: kind(dto['kind']), title: string(dto['title']), timing: timing(dto['timing']), color: string(dto['color']), status: status(dto['status']), recurring: bool(dto['recurring']) }; });
}
