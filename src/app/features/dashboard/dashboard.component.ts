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
import { DashboardFinancialSnapshot, GetDashboardFinancialSnapshotUseCase, ListRecentExpensesUseCase, RecentExpenseSummary } from '../expenses';
import { HouseholdStore } from '../household';

@Component({ selector: 'app-dashboard', standalone: true,
  imports: [RouterLink, TranslatePipe, LocalizedCurrencyPipe, LocalizedDatePipe, AvatarComponent, ButtonComponent, CardComponent, IconComponent, StatCardComponent],
  templateUrl: './dashboard.component.html' })
export class DashboardComponent {
  private readonly household = inject(HouseholdStore);
  private readonly auth = inject(AuthStore);
  private readonly listRecent = inject(ListRecentExpensesUseCase);
  private readonly getFinancialSnapshot = inject(GetDashboardFinancialSnapshotUseCase);
  readonly members = this.household.members;
  readonly householdName = computed(() => this.household.active()?.name ?? '—');
  readonly currentUserEmail = computed(() => this.auth.currentUser()?.email ?? '');
  readonly recentExpenses = signal<readonly RecentExpenseSummary[]>([]);
  readonly recentState = signal<'initial' | 'loading' | 'ready' | 'empty' | 'error'>('initial');
  readonly financial = signal<DashboardFinancialSnapshot | null>(null);
  readonly financialState = signal<'initial' | 'loading' | 'ready' | 'empty' | 'error'>('initial');
  readonly upcomingEvents = [...EVENTS].sort((a, b) => a.day - b.day).slice(0, 3);
  private requestId = 0;
  private financialRequestId = 0;

  constructor() { effect(() => { const active = this.household.active(); const summary = this.household.households().find(item => item.id === active?.id); if (active && summary) { void this.loadRecent(active.id); void this.loadFinancial(active.id, summary.currentMemberId); } else { this.recentExpenses.set([]); this.recentState.set('initial'); this.financial.set(null); this.financialState.set('initial'); } }); }

  memberName(id: string): string { return this.household.active()?.members.find(member => member.id === id)?.email ?? `${id.slice(0, 8)}…`; }
  eventDot(key: string): string { return EVENT_CATEGORIES.find(category => category.key === key)?.dot ?? 'bg-ncasa-sage'; }
  private async loadRecent(householdId: string): Promise<void> {
    const requestId = ++this.requestId; this.recentState.set('loading');
    try { const expenses = await firstValueFrom(this.listRecent.execute(householdId)); if (requestId === this.requestId) { this.recentExpenses.set(expenses); this.recentState.set(expenses.length ? 'ready' : 'empty'); } }
    catch { if (requestId === this.requestId) this.recentState.set('error'); }
  }
  private async loadFinancial(householdId: string, memberId: string): Promise<void> {
    const requestId = ++this.financialRequestId; this.financialState.set('loading');
    try { const result = await firstValueFrom(this.getFinancialSnapshot.execute(householdId, memberId, localMonth())); if (requestId === this.financialRequestId) { this.financial.set(result); this.financialState.set(result.monthly.length || result.personal.length ? 'ready' : 'empty'); } }
    catch { if (requestId === this.financialRequestId) this.financialState.set('error'); }
  }
}
const localMonth = (): string => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; };
