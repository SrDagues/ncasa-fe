import { Money } from './money';

export type ExpenseId = string;
export type HouseholdRef = string;
export type MemberRef = string;
export type ExpenseStatus = 'CONFIRMED' | 'VOIDED';
export type ExpenseSource = 'MANUAL';
export type ExpenseSplitType = 'EQUAL' | 'EXACT';

export interface ExpenseAllocation {
  readonly memberId: MemberRef;
  readonly amount: Money;
}

export interface Expense {
  readonly id: ExpenseId;
  readonly householdId: HouseholdRef;
  readonly createdByMemberId: MemberRef;
  readonly payerMemberId: MemberRef;
  readonly amount: Money;
  readonly description: string;
  readonly expenseDate: string;
  readonly splitType: ExpenseSplitType;
  readonly allocations: readonly ExpenseAllocation[];
  readonly status: ExpenseStatus;
  readonly source: ExpenseSource;
  readonly voidReason: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly voidedAt: string | null;
  readonly version: number;
}

export class ExpenseSplitError extends Error {}

export function splitEqually(total: Money, memberIds: readonly MemberRef[]): readonly ExpenseAllocation[] {
  const sorted = uniqueMembers(memberIds);
  if (!total.isPositive()) throw new ExpenseSplitError('Expense total must be positive');
  const count = BigInt(sorted.length);
  const base = total.minorUnits / count;
  const remainder = total.minorUnits % count;
  return sorted.map((memberId, index) => ({
    memberId,
    amount: Money.fromMinorUnits(base + (BigInt(index) < remainder ? 1n : 0n), total.currency),
  }));
}

export function validateExactSplit(total: Money, allocations: readonly ExpenseAllocation[]): void {
  uniqueMembers(allocations.map(item => item.memberId));
  if (!total.isPositive()) throw new ExpenseSplitError('Expense total must be positive');
  let allocated = Money.fromMinorUnits(0n, total.currency);
  for (const allocation of allocations) {
    if (!allocation.amount.isPositive()) throw new ExpenseSplitError('Allocation amounts must be positive');
    try { allocated = allocated.add(allocation.amount); }
    catch { throw new ExpenseSplitError('Allocation currencies must match the expense'); }
  }
  if (!allocated.equals(total)) throw new ExpenseSplitError('Allocations must add up to the expense total');
}

function uniqueMembers(memberIds: readonly MemberRef[]): readonly MemberRef[] {
  if (memberIds.length === 0) throw new ExpenseSplitError('At least one participant is required');
  const sorted = [...memberIds].sort((left, right) => left.localeCompare(right));
  if (new Set(sorted).size !== sorted.length) throw new ExpenseSplitError('A member cannot appear twice');
  return sorted;
}
