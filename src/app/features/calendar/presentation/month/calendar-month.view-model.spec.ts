import { describe, expect, it } from 'vitest';
import { CalendarOccurrence } from '../../domain/calendar.models';
import { buildMonthGrid, formatCalendarDate, madridLocalDate, SPANISH_WEEKDAYS } from './calendar-month.view-model';

describe('calendar month view model', () => {
  it('always presents the week from Monday to Sunday for Spain', () => {
    expect(SPANISH_WEEKDAYS).toEqual(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']);
    const grid = buildMonthGrid('2026-11', []);
    expect(grid[0].date).toBe('2026-10-26');
    expect(grid[6].date).toBe('2026-11-01');
  });

  it('shows a multi-day event on every day it covers', () => {
    const event = occurrence({ startDate: '2026-09-10', endDate: '2026-09-12' });
    const grid = buildMonthGrid('2026-09', [event]);
    expect(grid.filter(day => day.occurrences.length).map(day => day.date)).toEqual(['2026-09-10', '2026-09-11', '2026-09-12']);
  });

  it('calculates today in Europe/Madrid instead of the browser zone', () => {
    expect(madridLocalDate(new Date('2026-09-09T22:30:00Z'))).toBe('2026-09-10');
  });

  it('formats visible dates as day-month-year', () => {
    expect(formatCalendarDate('2026-09-05')).toBe('05-09-2026');
  });
});

const occurrence = (dates: { startDate: string; endDate: string | null }): CalendarOccurrence => ({
  itemId: 'event-1', occurrenceKey: dates.startDate, kind: 'EVENT', title: 'Viaje', color: '#D97963', status: 'PENDING', recurring: false,
  timing: { allDay: true, startDate: dates.startDate, startTime: null, endDate: dates.endDate, endTime: null },
});
