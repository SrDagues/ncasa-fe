import { Money } from './money';
import { Percentage } from './percentage';

export type ExpenseId = string;
export type HouseholdRef = string;
export type MemberRef = string;
export type ExpenseStatus = 'CONFIRMED' | 'VOIDED';
export type ExpenseSource = 'MANUAL' | 'PLAN';
export type ExpenseSplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE';
export type ExpenseCategoryId = string;
export type ExpenseCategoryStatus = 'ACTIVE' | 'ARCHIVED';
export type ExpenseDraftId = string;
export type ExpenseDraftStatus = 'OPEN' | 'CONFIRMED' | 'DISCARDED';
export type SettlementId = string;
export type SettlementStatus = 'CONFIRMED' | 'VOIDED';
export type FinancialCurrency = string;
export type ExpensePlanId = string;
export type ExpensePlanStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';
export type ExpensePlanFrequency = 'ONCE' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type ExpensePlanEndCondition =
  | { readonly type: 'UNTIL_DATE'; readonly endDate: string }
  | { readonly type: 'AFTER_OCCURRENCES'; readonly totalOccurrences: number };
export type ExpensePlanTemplateSplit =
  | { readonly type: 'EQUAL'; readonly memberIds: readonly MemberRef[] }
  | { readonly type: 'EXACT'; readonly allocations: readonly { readonly memberId: MemberRef; readonly amount: Money }[] }
  | { readonly type: 'PERCENTAGE'; readonly allocations: readonly PercentageAllocation[] };
export interface ExpensePlanTemplate { readonly description: string; readonly amount: Money; readonly payerMemberId: MemberRef; readonly categoryId: ExpenseCategoryId | null; readonly split: ExpensePlanTemplateSplit; }
export interface ExpensePlan {
  readonly id: ExpensePlanId; readonly householdId: HouseholdRef; readonly createdByMemberId: MemberRef;
  readonly template: ExpensePlanTemplate; readonly frequency: ExpensePlanFrequency; readonly startDate: string;
  readonly zoneId: string; readonly endCondition: ExpensePlanEndCondition; readonly reminderDaysBefore: number;
  readonly materializedOccurrences: number; readonly nextOccurrence: string | null; readonly nextOccurrenceDueAt: string | null;
  readonly nextReminderAt: string | null; readonly status: ExpensePlanStatus; readonly pauseReason: string | null;
  readonly cancellationReason: string | null; readonly createdAt: string; readonly updatedAt: string;
  readonly pausedAt: string | null; readonly cancelledAt: string | null; readonly completedAt: string | null; readonly version: number;
}

export interface MonthlyMemberPosition { readonly memberId: MemberRef; readonly paid: Money; readonly allocated: Money; readonly net: Money; }
export interface CurrentMemberPosition extends MonthlyMemberPosition { readonly settledOut: Money; readonly settledIn: Money; }
export interface SuggestedSettlement { readonly fromMemberId: MemberRef; readonly toMemberId: MemberRef; readonly amount: Money; }
export interface ExpenseCategory {
  readonly id: ExpenseCategoryId; readonly householdId: HouseholdRef; readonly createdByMemberId: MemberRef;
  readonly name: string; readonly status: ExpenseCategoryStatus; readonly createdAt: string;
  readonly updatedAt: string; readonly archivedAt: string | null; readonly version: number;
}
export interface PercentageAllocation { readonly memberId: MemberRef; readonly percentage: Percentage; }
export type ExpenseDraftSplit =
  | { readonly type: 'EQUAL'; readonly memberIds: readonly MemberRef[] }
  | { readonly type: 'EXACT'; readonly allocations: readonly { readonly memberId: MemberRef; readonly amount: Money }[] }
  | { readonly type: 'PERCENTAGE'; readonly allocations: readonly PercentageAllocation[] };
export interface ExpenseDraft {
  readonly id: ExpenseDraftId; readonly householdId: HouseholdRef; readonly createdByMemberId: MemberRef;
  readonly description: string | null; readonly payerMemberId: MemberRef | null; readonly amount: Money | null;
  readonly currency: string | null; readonly expenseDate: string | null; readonly categoryId: ExpenseCategoryId | null;
  readonly split: ExpenseDraftSplit | null; readonly status: ExpenseDraftStatus; readonly confirmedExpenseId: ExpenseId | null;
  readonly createdAt: string; readonly updatedAt: string; readonly confirmedAt: string | null;
  readonly discardedAt: string | null; readonly version: number;
}
export interface ExpenseClassificationChange {
  readonly id: string; readonly expenseId: ExpenseId; readonly changedByMemberId: MemberRef;
  readonly previousCategoryId: ExpenseCategoryId | null; readonly newCategoryId: ExpenseCategoryId | null;
  readonly reason: string | null; readonly changedAt: string;
}
export interface Settlement {
  readonly id: SettlementId; readonly householdId: HouseholdRef; readonly createdByMemberId: MemberRef;
  readonly fromMemberId: MemberRef; readonly toMemberId: MemberRef; readonly amount: Money;
  readonly settlementDate: string; readonly note: string | null; readonly status: SettlementStatus;
  readonly voidReason: string | null; readonly createdAt: string; readonly updatedAt: string;
  readonly voidedAt: string | null; readonly version: number;
}

export class SettlementValidationError extends Error {}
export function validateSettlement(amount: Money, from: CurrentMemberPosition, to: CurrentMemberPosition): void {
  if (!amount.isPositive()) throw new SettlementValidationError('Settlement amount must be positive');
  if (from.memberId === to.memberId) throw new SettlementValidationError('Settlement members must differ');
  if (amount.currency !== from.net.currency || amount.currency !== to.net.currency) throw new SettlementValidationError('Settlement currency must match positions');
  if (!from.net.isNegative() || !to.net.isPositive()) throw new SettlementValidationError('Settlement must reduce pending debt');
  if (amount.compare(from.net.absolute()) > 0 || amount.compare(to.net) > 0) throw new SettlementValidationError('Settlement exceeds pending debt');
}

export interface ExpenseAllocation {
  readonly memberId: MemberRef;
  readonly amount: Money;
}

export interface Expense {
  readonly id: ExpenseId;
  readonly householdId: HouseholdRef;
  readonly createdByMemberId: MemberRef;
  readonly payerMemberId: MemberRef;
  readonly categoryId: ExpenseCategoryId | null;
  readonly amount: Money;
  readonly description: string;
  readonly expenseDate: string;
  readonly splitType: ExpenseSplitType;
  readonly allocations: readonly ExpenseAllocation[];
  readonly status: ExpenseStatus;
  readonly source: ExpenseSource;
  readonly sourcePlanId?: ExpensePlanId | null;
  readonly occurrenceKey?: string | null;
  readonly voidReason: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly voidedAt: string | null;
  readonly version: number;
}

export class ExpensePlanValidationError extends Error {}
export interface ExpensePlanIntent {
  readonly template: ExpensePlanTemplate; readonly frequency: ExpensePlanFrequency; readonly startDate: string;
  readonly zoneId: string; readonly endCondition?: ExpensePlanEndCondition; readonly reminderDaysBefore: number;
}
export function validateExpensePlanIntent(intent: ExpensePlanIntent, todayInZone: string): void {
  if (!intent.template.description.trim() || intent.template.description.trim().length > 240) throw new ExpensePlanValidationError('Invalid description');
  if (!intent.template.amount.isPositive()) throw new ExpensePlanValidationError('Invalid amount');
  if (!intent.zoneId.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(intent.startDate) || intent.startDate < todayInZone) throw new ExpensePlanValidationError('Invalid schedule');
  if (!Number.isInteger(intent.reminderDaysBefore) || intent.reminderDaysBefore < 0 || intent.reminderDaysBefore > 30) throw new ExpensePlanValidationError('Invalid reminder');
  if (intent.frequency === 'ONCE' && intent.endCondition) throw new ExpensePlanValidationError('One-time plans have no end condition');
  if (intent.frequency !== 'ONCE' && !intent.endCondition) throw new ExpensePlanValidationError('Recurring plans require an end condition');
  if (intent.endCondition?.type === 'UNTIL_DATE' && intent.endCondition.endDate < intent.startDate) throw new ExpensePlanValidationError('End date precedes start');
  if (intent.endCondition?.type === 'AFTER_OCCURRENCES' && (!Number.isInteger(intent.endCondition.totalOccurrences) || intent.endCondition.totalOccurrences < 1)) throw new ExpensePlanValidationError('Invalid occurrence count');
  if (intent.template.split.type === 'EXACT') validateExactSplit(intent.template.amount, intent.template.split.allocations);
  if (intent.template.split.type === 'PERCENTAGE') materializePercentageSplit(intent.template.amount, intent.template.split.allocations);
  if (intent.template.split.type === 'EQUAL') splitEqually(intent.template.amount, intent.template.split.memberIds);
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

export function distributePercentagesEqually(memberIds: readonly MemberRef[]): readonly PercentageAllocation[] {
  const sorted = uniqueMembers(memberIds);
  const count = BigInt(sorted.length);
  const base = Percentage.totalBasisPoints / count;
  const remainder = Percentage.totalBasisPoints % count;
  return sorted.map((memberId, index) => ({
    memberId,
    percentage: Percentage.fromBasisPoints(base + (BigInt(index) < remainder ? 1n : 0n)),
  }));
}

export function materializePercentageSplit(total: Money, percentages: readonly PercentageAllocation[]): readonly ExpenseAllocation[] {
  uniqueMembers(percentages.map(item => item.memberId));
  if (!total.isPositive()) throw new ExpenseSplitError('Expense total must be positive');
  const percentageTotal = percentages.reduce((sum, item) => sum + item.percentage.basisPoints, 0n);
  if (percentageTotal !== Percentage.totalBasisPoints) throw new ExpenseSplitError('Percentages must add up to 100.00');
  const shares = percentages.map(item => {
    const weighted = total.minorUnits * item.percentage.basisPoints;
    return { item, units: weighted / Percentage.totalBasisPoints, remainder: weighted % Percentage.totalBasisPoints };
  });
  const assigned = shares.reduce((sum, share) => sum + share.units, 0n);
  const remaining = Number(total.minorUnits - assigned);
  const priority = [...shares].sort((left, right) => left.remainder === right.remainder
    ? left.item.memberId.localeCompare(right.item.memberId)
    : left.remainder > right.remainder ? -1 : 1);
  const bonus = new Set(priority.slice(0, remaining).map(share => share.item.memberId));
  return [...shares].sort((left, right) => left.item.memberId.localeCompare(right.item.memberId)).map(share => ({
    memberId: share.item.memberId,
    amount: Money.fromMinorUnits(share.units + (bonus.has(share.item.memberId) ? 1n : 0n), total.currency),
  }));
}

function uniqueMembers(memberIds: readonly MemberRef[]): readonly MemberRef[] {
  if (memberIds.length === 0) throw new ExpenseSplitError('At least one participant is required');
  const sorted = [...memberIds].sort((left, right) => left.localeCompare(right));
  if (new Set(sorted).size !== sorted.length) throw new ExpenseSplitError('A member cannot appear twice');
  return sorted;
}
