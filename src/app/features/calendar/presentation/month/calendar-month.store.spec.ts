import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { CalendarMonthStore } from './calendar-month.store';

describe('CalendarMonthStore', () => {
  it('exposes loaded occurrences sorted by day, all-day and title', async () => {
    const useCase = { execute: () => of([
      { itemId: '2', occurrenceKey: '2026-09-02T10:00', kind: 'EVENT' as const, title: 'Zoo', timing: { allDay: false, startDate: '2026-09-02', startTime: '10:00', endDate: null, endTime: null }, color: '#000000', status: 'PENDING' as const, recurring: false },
      { itemId: '1', occurrenceKey: '2026-09-02', kind: 'TASK' as const, title: 'Alarma', timing: { allDay: true, startDate: '2026-09-02', startTime: null, endDate: null, endTime: null }, color: '#000000', status: 'PENDING' as const, recurring: false },
    ]) };
    const store = new CalendarMonthStore(useCase as never);
    await store.load('h1', '2026-09');
    expect(store.occurrences().map(item => item.title)).toEqual(['Alarma', 'Zoo']);
    expect(store.state()).toBe('ready');
  });

  it('keeps an explicit error state when loading fails', async () => {
    const store = new CalendarMonthStore({ execute: () => throwError(() => new Error('offline')) } as never);
    await store.load('h1', '2026-09');
    expect(store.state()).toBe('error');
  });
});
