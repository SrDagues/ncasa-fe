import { signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ListCalendarOccurrencesUseCase } from '../../application/use-cases/calendar.use-cases';
import { calendarRangeForMonth, CalendarOccurrence } from '../../domain/calendar.models';

export type CalendarLoadState = 'initial' | 'loading' | 'ready' | 'empty' | 'error';
export class CalendarMonthStore {
  private readonly items = signal<readonly CalendarOccurrence[]>([]);
  private readonly loadState = signal<CalendarLoadState>('initial');
  private request = 0;
  readonly occurrences = this.items.asReadonly();
  readonly state = this.loadState.asReadonly();
  constructor(private readonly list: ListCalendarOccurrencesUseCase) {}
  async load(householdId: string, month: string): Promise<void> {
    const request = ++this.request; this.loadState.set('loading');
    try { const range = calendarRangeForMonth(month); const result = [...await firstValueFrom(this.list.execute(householdId, range.from, range.to))].sort(compareOccurrence); if (request === this.request) { this.items.set(result); this.loadState.set(result.length ? 'ready' : 'empty'); } }
    catch { if (request === this.request) this.loadState.set('error'); }
  }
}
const compareOccurrence = (left: CalendarOccurrence, right: CalendarOccurrence): number => left.timing.startDate.localeCompare(right.timing.startDate) || (left.timing.allDay === right.timing.allDay ? 0 : left.timing.allDay ? -1 : 1) || (left.timing.startTime ?? '').localeCompare(right.timing.startTime ?? '') || left.title.localeCompare(right.title);
