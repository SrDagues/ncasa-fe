import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedDatePipe } from '../../core/i18n/localized-format.pipe';
import { CardComponent } from '../../shared/components/card/card.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { HouseholdStore } from '../household';
import { CalendarKind, CalendarOccurrence } from './domain/calendar.models';
import { CalendarMonthStore } from './presentation/month/calendar-month.store';
import { buildMonthGrid, formatCalendarDate, madridLocalDate, SPANISH_WEEKDAYS } from './presentation/month/calendar-month.view-model';

@Component({
  selector: 'app-calendar',
  imports: [RouterLink, TranslatePipe, LocalizedDatePipe, CardComponent, IconComponent],
  templateUrl: './calendar.component.html',
})
export class CalendarComponent {
  protected readonly store = inject(CalendarMonthStore);
  private readonly household = inject(HouseholdStore);
  protected readonly today = madridLocalDate();
  protected readonly month = signal(this.today.slice(0, 7));
  protected readonly selectedDate = signal(this.today);
  protected readonly weekdays = SPANISH_WEEKDAYS;
  protected readonly monthDate = computed(() => `${this.month()}-01`);
  protected readonly selectedDateLabel = computed(() => formatCalendarDate(this.selectedDate()));
  protected readonly monthFormat: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
  protected readonly grid = computed(() => buildMonthGrid(this.month(), this.store.occurrences()));
  protected readonly selectedOccurrences = computed(() => this.grid().find(day => day.date === this.selectedDate())?.occurrences ?? []);
  protected readonly counts = computed(() => ({
    TASK: this.count('TASK'), EVENT: this.count('EVENT'), SPECIAL_DATE: this.count('SPECIAL_DATE'),
  }));

  constructor() {
    effect(() => { const id = this.household.active()?.id; const month = this.month(); if (id) void this.store.load(id, month); });
  }

  protected move(offset: number): void {
    const [year, month] = this.month().split('-').map(Number);
    const next = new Date(Date.UTC(year, month - 1 + offset, 1));
    const nextMonth = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`;
    this.month.set(nextMonth); this.selectedDate.set(`${nextMonth}-01`);
  }
  protected goToday(): void { this.month.set(this.today.slice(0, 7)); this.selectedDate.set(this.today); }
  protected retry(): void { const id = this.household.active()?.id; if (id) void this.store.load(id, this.month()); }
  protected selectDay(date: string): void { this.selectedDate.set(date); if (!date.startsWith(this.month())) this.month.set(date.slice(0, 7)); }
  protected typeKey(kind: CalendarKind): string { return `calendar.kinds.${kind.toLowerCase()}`; }
  protected typeIcon(kind: CalendarKind): string { return kind === 'TASK' ? 'check-square' : kind === 'EVENT' ? 'calendar' : 'heart'; }
  protected displayTime(value: string | null): string { return value?.slice(0, 5) ?? ''; }
  protected formatDate(value: string): string { return formatCalendarDate(value); }
  private count(kind: CalendarKind): number { return this.store.occurrences().filter(item => item.kind === kind && item.timing.startDate.startsWith(this.month())).length; }
}
