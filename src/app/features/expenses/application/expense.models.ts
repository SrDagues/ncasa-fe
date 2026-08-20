import { Expense, ExpenseStatus, HouseholdRef, MemberRef, Money } from '../domain';

export interface ExpenseFilters {
  readonly from?: string;
  readonly to?: string;
  readonly status: ExpenseStatus;
}

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
