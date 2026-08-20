import { CurrentMemberPosition, Expense, ExpenseStatus, HouseholdRef, MemberRef, Money, MonthlyMemberPosition, Settlement, SettlementStatus, SuggestedSettlement } from '../domain';

export interface ExpenseFilters {
  readonly from?: string;
  readonly to?: string;
  readonly status: ExpenseStatus;
  readonly payerMemberId?: MemberRef;
  readonly participantMemberId?: MemberRef;
}

export interface MonthlyCurrencySummary { readonly currency: string; readonly totalExpenses: Money; readonly members: readonly MonthlyMemberPosition[]; }
export interface MonthlyFinancialSummary { readonly householdId: HouseholdRef; readonly month: string; readonly currencies: readonly MonthlyCurrencySummary[]; }
export interface DebtCurrencySummary { readonly currency: string; readonly members: readonly CurrentMemberPosition[]; readonly suggestedSettlements: readonly SuggestedSettlement[]; }
export interface DebtSummary { readonly householdId: HouseholdRef; readonly asOf: string; readonly currencies: readonly DebtCurrencySummary[]; }
export interface SettlementFilters { readonly from?: string; readonly to?: string; readonly status?: SettlementStatus; readonly memberId?: MemberRef; }
export interface SettlementPage { readonly items: readonly Settlement[]; readonly page: number; readonly size: number; readonly totalElements: number; readonly totalPages: number; }
export interface CreateSettlementCommand { readonly idempotencyKey: string; readonly fromMemberId: MemberRef; readonly toMemberId: MemberRef; readonly amount: Money; readonly settlementDate: string; readonly note?: string; }
export interface DashboardFinancialSnapshot { readonly monthly: readonly { currency: string; totalExpenses: Money }[]; readonly personal: readonly { currency: string; net: Money }[]; }

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
  | { readonly type: 'EXACT'; readonly allocations: readonly { readonly memberId: MemberRef; readonly amount: Money }[] };

export interface CreateExpenseCommand {
  readonly description: string;
  readonly amount: Money;
  readonly expenseDate: string;
  readonly payerMemberId: MemberRef;
  readonly split: CreateExpenseSplit;
}

export interface RecentExpenseSummary {
  readonly id: string;
  readonly householdId: HouseholdRef;
  readonly payerMemberId: MemberRef;
  readonly description: string;
  readonly expenseDate: string;
  readonly amount: Money;
  readonly status: ExpenseStatus;
}
