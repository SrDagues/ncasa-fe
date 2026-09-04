import { CurrentMemberPosition, Expense, ExpenseCategoryId, ExpenseDraftId, ExpenseDraftSplit, ExpensePlan, ExpensePlanEndCondition, ExpensePlanFrequency, ExpensePlanStatus, ExpensePlanTemplate, ExpenseSource, ExpenseStatus, ExpenseSplitType, HouseholdRef, MemberRef, Money, MonthlyMemberPosition, Percentage, Settlement, SettlementStatus, SuggestedSettlement } from '../domain';

export type ExpenseCategoryFilter =
  | { readonly kind: 'ALL' }
  | { readonly kind: 'CATEGORY'; readonly categoryId: ExpenseCategoryId }
  | { readonly kind: 'UNCATEGORIZED' };

export interface ExpenseFilters {
  readonly from?: string;
  readonly to?: string;
  readonly status: ExpenseStatus;
  readonly payerMemberId?: MemberRef;
  readonly participantMemberId?: MemberRef;
  readonly category?: ExpenseCategoryFilter;
  readonly splitType?: ExpenseSplitType;
  readonly source?: ExpenseSource;
  readonly planId?: string;
}

export interface MonthlyCategorySummary { readonly categoryId: ExpenseCategoryId | null; readonly name: string | null; readonly total: Money; }
export interface MonthlyCurrencySummary { readonly currency: string; readonly totalExpenses: Money; readonly members: readonly MonthlyMemberPosition[]; readonly categories: readonly MonthlyCategorySummary[]; }
export interface MonthlyFinancialSummary { readonly householdId: HouseholdRef; readonly month: string; readonly currencies: readonly MonthlyCurrencySummary[]; }
export interface DebtCurrencySummary { readonly currency: string; readonly members: readonly CurrentMemberPosition[]; readonly suggestedSettlements: readonly SuggestedSettlement[]; }
export interface DebtSummary { readonly householdId: HouseholdRef; readonly asOf: string; readonly currencies: readonly DebtCurrencySummary[]; }
export interface SettlementFilters { readonly from?: string; readonly to?: string; readonly status?: SettlementStatus; readonly memberId?: MemberRef; }
export interface SettlementPage { readonly items: readonly Settlement[]; readonly page: number; readonly size: number; readonly totalElements: number; readonly totalPages: number; }
export interface CreateSettlementCommand { readonly idempotencyKey: string; readonly fromMemberId: MemberRef; readonly toMemberId: MemberRef; readonly amount: Money; readonly settlementDate: string; readonly note?: string; }
export interface DashboardFinancialSnapshot { readonly monthly: readonly { currency: string; totalExpenses: Money }[]; readonly personal: readonly { currency: string; net: Money }[]; }
export interface ExpensePlanFilters { readonly status: ExpensePlanStatus; readonly payerMemberId?: MemberRef; readonly participantMemberId?: MemberRef; readonly frequency?: ExpensePlanFrequency; readonly nextOccurrenceFrom?: string; readonly nextOccurrenceTo?: string; }
export interface ExpensePlanPage { readonly items: readonly ExpensePlan[]; readonly page: number; readonly size: number; readonly totalElements: number; readonly totalPages: number; }
export interface CreateExpensePlanCommand { readonly template: ExpensePlanTemplate; readonly frequency: ExpensePlanFrequency; readonly startDate: string; readonly zoneId: string; readonly endCondition?: ExpensePlanEndCondition; readonly reminderDaysBefore: number; }
export interface ExpensePlanForecastOccurrence { readonly planId: string; readonly occurrenceKey: string; readonly occurrenceDate: string; readonly description: string; readonly amount: Money; readonly payerMemberId: MemberRef; readonly categoryId: ExpenseCategoryId | null; readonly allocations: readonly { readonly memberId: MemberRef; readonly amount: Money }[]; readonly lastOccurrence: boolean; }
export interface ExpensePlanForecast { readonly householdId: HouseholdRef; readonly from: string; readonly to: string; readonly currencies: readonly { readonly currency: string; readonly total: Money }[]; readonly occurrences: readonly ExpensePlanForecastOccurrence[]; }
export interface DashboardUpcomingExpense { readonly planId: string; readonly description: string; readonly amount: Money; readonly occurrenceDate: string; readonly lastOccurrence: boolean; readonly reminderDue: boolean; }

export interface ExpensePagination { readonly page: number; readonly size: number; }

export interface ExpensePage {
  readonly items: readonly Expense[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

export type CreateExpenseSplit =
  | { readonly type: 'EQUAL'; readonly memberIds: readonly MemberRef[] }
  | { readonly type: 'EXACT'; readonly allocations: readonly { readonly memberId: MemberRef; readonly amount: Money }[] }
  | { readonly type: 'PERCENTAGE'; readonly allocations: readonly { readonly memberId: MemberRef; readonly percentage: Percentage }[] };

export interface CreateExpenseCommand {
  readonly description: string;
  readonly amount: Money;
  readonly expenseDate: string;
  readonly payerMemberId: MemberRef;
  readonly categoryId?: ExpenseCategoryId;
  readonly split: CreateExpenseSplit;
}

export interface ExpenseDraftSnapshot {
  readonly description: string | null; readonly amount: Money | null; readonly currency: string | null;
  readonly expenseDate: string | null; readonly payerMemberId: MemberRef | null;
  readonly categoryId: ExpenseCategoryId | null; readonly split: ExpenseDraftSplit | null;
}
export interface SaveExpenseDraftCommand {
  readonly householdId: HouseholdRef; readonly draftId?: ExpenseDraftId; readonly version?: number;
  readonly snapshot: ExpenseDraftSnapshot;
}
export interface ReclassifyExpenseCommand { readonly categoryId: ExpenseCategoryId | null; readonly reason?: string; }

export interface RecentExpenseSummary {
  readonly id: string;
  readonly householdId: HouseholdRef;
  readonly payerMemberId: MemberRef;
  readonly description: string;
  readonly expenseDate: string;
  readonly amount: Money;
  readonly status: ExpenseStatus;
}
