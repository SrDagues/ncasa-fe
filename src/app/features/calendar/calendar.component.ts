import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconButtonComponent } from '../../shared/components/icon-button/icon-button.component';
import { EVENTS, EVENT_CATEGORIES } from '.';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedDatePipe } from '../../core/i18n/localized-format.pipe';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    IconButtonComponent,
    TranslatePipe,
    LocalizedDatePipe,
  ],
  templateUrl: './calendar.component.html',
})
export class CalendarComponent {
  readonly monthLabel = 'Mayo 2024';
  readonly weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  readonly today = 12;
  readonly categories = EVENT_CATEGORIES;

  readonly events = [...EVENTS].sort((a, b) => a.day - b.day);
  readonly grid = this.buildGrid();

  private buildGrid(): any[] {
    // May 2024 starts on a Wednesday (Monday-first grid => 2 leading blanks).
    const leading = 2;
    const daysInMonth = 31;
    const cells: any[] = [];

    for (let i = 0; i < leading; i++) {
      cells.push({ day: null, events: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        isToday: d === this.today,
        events: EVENTS.filter((e) => e.day === d).map((e) => e.category),
      });
    }
    return cells;
  }

  dot(key: string): string {
    return this.categories.find((c) => c.key === key)?.dot ?? 'bg-ncasa-sage';
  }

  chip(key: string): string {
    return this.categories.find((c) => c.key === key)?.chip ?? 'bg-ncasa-sage-soft text-ncasa-forest';
  }

  categoryLabel(key: string): string {
    return this.categories.find((c) => c.key === key)?.labelKey ?? '';
  }

  trackEvent(_: number, e: { id: string }): string {
    return e.id;
  }
}
