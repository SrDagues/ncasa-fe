import { calendarRangeForMonth, CalendarOccurrence } from '../../domain/calendar.models';

export const SPANISH_WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

export interface CalendarDayViewModel {
  readonly date: string;
  readonly day: number;
  readonly inMonth: boolean;
  readonly weekend: boolean;
  readonly occurrences: readonly CalendarOccurrence[];
}

export function buildMonthGrid(month: string, occurrences: readonly CalendarOccurrence[]): readonly CalendarDayViewModel[] {
  const range = calendarRangeForMonth(month);
  const days: CalendarDayViewModel[] = [];
  for (let date = range.from; date <= range.to; date = plusDays(date, 1)) {
    const weekDay = new Date(`${date}T12:00:00Z`).getUTCDay();
    days.push({
      date,
      day: Number(date.slice(8)),
      inMonth: date.startsWith(month),
      weekend: weekDay === 0 || weekDay === 6,
      occurrences: occurrences.filter(item => covers(item, date)),
    });
  }
  return days;
}

export function madridLocalDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function formatCalendarDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  return `${day}-${month}-${year}`;
}

const covers = (item: CalendarOccurrence, date: string): boolean =>
  item.timing.startDate <= date && (item.timing.endDate ?? item.timing.startDate) >= date;
const plusDays = (iso: string, amount: number): string => { const date = new Date(`${iso}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + amount); return date.toISOString().slice(0, 10); };
