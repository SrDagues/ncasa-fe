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
import { CalendarOccurrence, ListCalendarOccurrencesUseCase } from '../calendar';
import { DashboardFinancialSnapshot, DashboardUpcomingExpense, GetDashboardFinancialSnapshotUseCase, GetDashboardUpcomingExpenseUseCase, ListRecentExpensesUseCase, RecentExpenseSummary } from '../expenses';
import { HouseholdStore } from '../household';

@Component({ selector: 'app-dashboard', standalone: true,
  imports: [RouterLink, TranslatePipe, LocalizedCurrencyPipe, LocalizedDatePipe, AvatarComponent, ButtonComponent, CardComponent, IconComponent, StatCardComponent],
  templateUrl: './dashboard.component.html' })
export class DashboardComponent {
  private readonly household = inject(HouseholdStore);
  private readonly auth = inject(AuthStore);
  private readonly listRecent = inject(ListRecentExpensesUseCase);
  private readonly getFinancialSnapshot = inject(GetDashboardFinancialSnapshotUseCase);
  private readonly getUpcomingExpense = inject(GetDashboardUpcomingExpenseUseCase);
  private readonly listCalendar = inject(ListCalendarOccurrencesUseCase);
  readonly members = this.household.members;
  readonly householdName = computed(() => this.household.active()?.name ?? '—');
  readonly currentUserEmail = computed(() => this.auth.currentUser()?.email ?? '');
  readonly recentExpenses = signal<readonly RecentExpenseSummary[]>([]);
  readonly recentState = signal<'initial' | 'loading' | 'ready' | 'empty' | 'error'>('initial');
  readonly financial = signal<DashboardFinancialSnapshot | null>(null);
  readonly financialState = signal<'initial' | 'loading' | 'ready' | 'empty' | 'error'>('initial');
  readonly upcomingExpense=signal<DashboardUpcomingExpense|null>(null);readonly upcomingExpenseState=signal<'initial'|'loading'|'ready'|'empty'|'error'>('initial');
  readonly upcomingEvents = signal<readonly CalendarOccurrence[]>([]);
  readonly calendarState = signal<'initial' | 'loading' | 'ready' | 'empty' | 'error'>('initial');
  private requestId = 0;
  private financialRequestId = 0;
  private upcomingRequestId=0;
  private calendarRequestId=0;

  constructor() { effect(() => { const active = this.household.active(); const summary = this.household.households().find(item => item.id === active?.id); if (active && summary) { void this.loadRecent(active.id); void this.loadFinancial(active.id, summary.currentMemberId);void this.loadUpcoming(active.id); void this.loadCalendar(active.id); } else { this.recentExpenses.set([]); this.recentState.set('initial'); this.financial.set(null); this.financialState.set('initial');this.upcomingExpense.set(null);this.upcomingExpenseState.set('initial'); this.upcomingEvents.set([]); this.calendarState.set('initial'); } }); }

  memberName(id: string): string { return this.household.active()?.members.find(member => member.id === id)?.email ?? `${id.slice(0, 8)}…`; }
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
  private async loadUpcoming(householdId:string){const request=++this.upcomingRequestId;this.upcomingExpenseState.set('loading');const from=localDate(0),to=localDate(90);try{const value=await firstValueFrom(this.getUpcomingExpense.execute(householdId,from,to,new Date().toISOString()));if(request===this.upcomingRequestId){this.upcomingExpense.set(value);this.upcomingExpenseState.set(value?'ready':'empty');}}catch{if(request===this.upcomingRequestId)this.upcomingExpenseState.set('error');}}
  private async loadCalendar(householdId:string):Promise<void>{const request=++this.calendarRequestId;this.calendarState.set('loading');try{const values=await firstValueFrom(this.listCalendar.execute(householdId,localDate(0),localDate(30)));if(request===this.calendarRequestId){const items=[...values].sort((a,b)=>a.timing.startDate.localeCompare(b.timing.startDate)||(a.timing.startTime??'').localeCompare(b.timing.startTime??'')).slice(0,3);this.upcomingEvents.set(items);this.calendarState.set(items.length?'ready':'empty');}}catch{if(request===this.calendarRequestId)this.calendarState.set('error');}}
}
const localMonth = (): string => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; };
const localDate=(days:number)=>{const date=new Date();date.setDate(date.getDate()+days);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;};
