import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedCurrencyPipe, LocalizedDatePipe } from '../../core/i18n/localized-format.pipe';
import {
  CATEGORIES,
  EVENTS,
  EVENT_CATEGORIES,
  EXPENSES,
  MEMBERS,
} from '../../core/demo-content';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    CardComponent,
    StatCardComponent,
    BadgeComponent,
    AvatarComponent,
    ButtonComponent,
    TranslatePipe,
    LocalizedCurrencyPipe,
    LocalizedDatePipe,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  readonly members = MEMBERS;
  readonly currentMember = MEMBERS[0];

  readonly recentExpenses = EXPENSES.slice(0, 4);
  readonly upcomingEvents = [...EVENTS].sort((a, b) => a.day - b.day).slice(0, 3);

  get totalThisMonth(): number {
    return EXPENSES.reduce((sum, e) => sum + e.amount, 0);
  }

  get pendingToSplit(): number {
    return EXPENSES.filter((e) => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
  }

  categoryIcon(key: string): string {
    return CATEGORIES.find((c) => c.key === key)?.icon ?? 'tag';
  }

  categoryLabel(key: string): string {
    return CATEGORIES.find((c) => c.key === key)?.labelKey ?? 'common.other';
  }

  eventDot(key: string): string {
    return EVENT_CATEGORIES.find((c) => c.key === key)?.dot ?? 'bg-ncasa-sage';
  }

  statusTone(status: string): 'positive' | 'warning' | 'neutral' {
    if (status === 'settled') return 'positive';
    if (status === 'pending') return 'warning';
    return 'neutral';
  }

  absAmount(value: number): number {
    return Math.abs(value);
  }

  trackEvent(_: number, event: { id: string }): string {
    return event.id;
  }
}
