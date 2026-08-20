import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { LocalizedCurrencyPipe, LocalizedDatePipe } from '../../core/i18n/localized-format.pipe';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { AuthStore } from '../auth';
import { EVENT_CATEGORIES, EVENTS } from '../calendar';
import { ListRecentExpensesUseCase, RecentExpenseSummary } from '../expenses';
import { HouseholdStore } from '../household';

@Component({ selector: 'app-dashboard', standalone: true,
  imports: [RouterLink, TranslatePipe, LocalizedCurrencyPipe, LocalizedDatePipe, AvatarComponent, ButtonComponent, CardComponent, IconComponent, StatCardComponent],
  templateUrl: './dashboard.component.html' })
export class DashboardComponent {
  private readonly household = inject(HouseholdStore);
  private readonly auth = inject(AuthStore);
  private readonly listRecent = inject(ListRecentExpensesUseCase);
  readonly members = this.household.members;
  readonly householdName = computed(() => this.household.active()?.name ?? '—');
  readonly currentUserEmail = computed(() => this.auth.currentUser()?.email ?? '');
  readonly recentExpenses = signal<readonly RecentExpenseSummary[]>([]);
  readonly recentState = signal<'initial' | 'loading' | 'ready' | 'empty' | 'error'>('initial');
  readonly upcomingEvents = [...EVENTS].sort((a, b) => a.day - b.day).slice(0, 3);
  private requestId = 0;

  constructor() { effect(() => { const id = this.household.active()?.id; if (id) void this.loadRecent(id); else { this.recentExpenses.set([]); this.recentState.set('initial'); } }); }

  memberName(id: string): string { return this.household.active()?.members.find(member => member.id === id)?.email ?? `${id.slice(0, 8)}…`; }
  eventDot(key: string): string { return EVENT_CATEGORIES.find(category => category.key === key)?.dot ?? 'bg-ncasa-sage'; }
  private async loadRecent(householdId: string): Promise<void> {
    const requestId = ++this.requestId; this.recentState.set('loading');
    try { const expenses = await firstValueFrom(this.listRecent.execute(householdId)); if (requestId === this.requestId) { this.recentExpenses.set(expenses); this.recentState.set(expenses.length ? 'ready' : 'empty'); } }
    catch { if (requestId === this.requestId) this.recentState.set('error'); }
  }
}
