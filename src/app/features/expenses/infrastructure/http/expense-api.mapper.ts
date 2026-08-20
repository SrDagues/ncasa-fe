import { ExpenseApplicationError } from '../../application/expense.errors';
import { ExpensePage } from '../../application/expense.models';
import { Expense, Money } from '../../domain';

type Json = Readonly<Record<string, unknown>>;
const invalid = (): never => { throw new ExpenseApplicationError('unexpected', 'Invalid expense response'); };
const object = (value: unknown): Json => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Json : invalid();
const string = (value: unknown): string => typeof value === 'string' ? value : invalid();
const nullableString = (value: unknown): string | null => value === null ? null : string(value);
const number = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) ? value : invalid();

export function mapExpense(value: unknown): Expense {
  const dto = object(value);
  const currency = string(dto['currency']);
  const status = string(dto['status']);
  const source = string(dto['source']);
  const splitType = string(dto['splitType']);
  if (status !== 'CONFIRMED' && status !== 'VOIDED') return invalid();
  if (source !== 'MANUAL') return invalid();
  if (splitType !== 'EQUAL' && splitType !== 'EXACT') return invalid();
  const allocations = dto['allocations'];
  if (!Array.isArray(allocations)) return invalid();
  return {
    id: string(dto['id']), householdId: string(dto['householdId']), createdByMemberId: string(dto['createdByMemberId']),
    payerMemberId: string(dto['payerMemberId']), amount: Money.fromDecimal(string(dto['amount']), currency),
    description: string(dto['description']), expenseDate: string(dto['expenseDate']), splitType,
    allocations: allocations.map(item => { const allocation = object(item); return {
      memberId: string(allocation['memberId']), amount: Money.fromDecimal(string(allocation['amount']), currency),
    }; }),
    status, source, voidReason: nullableString(dto['voidReason']), createdAt: string(dto['createdAt']),
    updatedAt: string(dto['updatedAt']), voidedAt: nullableString(dto['voidedAt']), version: number(dto['version']),
  };
}

export function mapExpensePage(value: unknown): ExpensePage {
  const dto = object(value);
  const items = dto['items'];
  if (!Array.isArray(items)) return invalid();
  return { items: items.map(mapExpense), page: number(dto['page']), size: number(dto['size']),
    totalElements: number(dto['totalElements']), totalPages: number(dto['totalPages']) };
}
