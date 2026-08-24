import { ExpenseApplicationError } from '../../application/expense.errors';
import { ExpenseCategory, ExpenseDraft, ExpenseDraftSplit, Money, Percentage } from '../../domain';

type Json = Readonly<Record<string, unknown>>;
const invalid = (): never => { throw new ExpenseApplicationError('unexpected', 'Invalid expense workflow response'); };
const object = (value: unknown): Json => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Json : invalid();
const text = (value: unknown): string => typeof value === 'string' ? value : invalid();
const nullableText = (value: unknown): string | null => value === null || value === undefined ? null : text(value);
const integer = (value: unknown): number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : invalid();
const array = (value: unknown): readonly unknown[] => Array.isArray(value) ? value : invalid();
const money = (value: string, currency: string): Money => {
  const normalized = value.includes('.') ? value.replace(/0+$/, '').replace(/\.$/, '') : value;
  return Money.fromDecimal(normalized || '0', currency);
};

export function mapExpenseCategory(value: unknown): ExpenseCategory {
  const dto = object(value); const status = text(dto['status']);
  if (status !== 'ACTIVE' && status !== 'ARCHIVED') return invalid();
  return { id: text(dto['id']), householdId: text(dto['householdId']), createdByMemberId: text(dto['createdByMemberId']),
    name: text(dto['name']), status, createdAt: text(dto['createdAt']), updatedAt: text(dto['updatedAt']),
    archivedAt: nullableText(dto['archivedAt']), version: integer(dto['version']) };
}
export const mapExpenseCategories = (value: unknown): readonly ExpenseCategory[] => array(value).map(mapExpenseCategory);

export function mapExpenseDraft(value: unknown): ExpenseDraft {
  const dto = object(value); const status = text(dto['status']);
  if (status !== 'OPEN' && status !== 'CONFIRMED' && status !== 'DISCARDED') return invalid();
  const currency = nullableText(dto['currency']); const amountText = nullableText(dto['amount']);
  const splitType = nullableText(dto['splitType']); const allocations = array(dto['allocations']);
  let split: ExpenseDraftSplit | null = null;
  if (splitType === 'EQUAL') split = { type: 'EQUAL', memberIds: allocations.map(item => text(object(item)['memberId'])) };
  else if (splitType === 'EXACT') split = { type: 'EXACT', allocations: allocations.map(item => { const allocation = object(item); if (!currency) return invalid(); return { memberId: text(allocation['memberId']), amount: money(text(allocation['amount']), currency) }; }) };
  else if (splitType === 'PERCENTAGE') split = { type: 'PERCENTAGE', allocations: allocations.map(item => { const allocation = object(item); return { memberId: text(allocation['memberId']), percentage: Percentage.fromDecimal(text(allocation['percentage'])) }; }) };
  else if (splitType !== null) return invalid();
  return { id: text(dto['id']), householdId: text(dto['householdId']), createdByMemberId: text(dto['createdByMemberId']),
    description: nullableText(dto['description']), payerMemberId: nullableText(dto['payerMemberId']),
    amount: amountText && currency ? money(amountText, currency) : null, currency, expenseDate: nullableText(dto['expenseDate']),
    categoryId: nullableText(dto['categoryId']), split, status, confirmedExpenseId: nullableText(dto['confirmedExpenseId']),
    createdAt: text(dto['createdAt']), updatedAt: text(dto['updatedAt']), confirmedAt: nullableText(dto['confirmedAt']),
    discardedAt: nullableText(dto['discardedAt']), version: integer(dto['version']) };
}
export const mapExpenseDrafts = (value: unknown): readonly ExpenseDraft[] => array(value).map(mapExpenseDraft);
