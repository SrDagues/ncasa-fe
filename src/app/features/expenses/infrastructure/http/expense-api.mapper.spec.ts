import { describe, expect, it } from 'vitest';
import { ExpenseApplicationError } from '../../application/expense.errors';
import { mapExpense } from './expense-api.mapper';

const valid = { id: 'e1', householdId: 'h1', createdByMemberId: 'm1', payerMemberId: 'm1', amount: '900719925474099.99',
  currency: 'EUR', description: 'Compra', expenseDate: '2026-08-20', splitType: 'EXACT',
  allocations: [{ memberId: 'm1', amount: '900719925474099.99' }], status: 'CONFIRMED', source: 'MANUAL', voidReason: null,
  createdAt: '2026-08-20T10:00:00Z', updatedAt: '2026-08-20T10:00:00Z', voidedAt: null, version: 1 };

describe('expense API mapper', () => {
  it('keeps amounts beyond Number.MAX_SAFE_INTEGER exact', () => {
    expect(mapExpense(valid).amount.toDecimal()).toBe('900719925474099.99');
  });
  it('rejects unknown server vocabulary', () => {
    expect(() => mapExpense({ ...valid, status: 'DRAFT' })).toThrow(ExpenseApplicationError);
    expect(() => mapExpense({ ...valid, splitType: 'PERCENTAGE' })).toThrow(ExpenseApplicationError);
  });
  it('rejects malformed response shapes', () => {
    expect(() => mapExpense({ ...valid, allocations: null })).toThrow(ExpenseApplicationError);
  });
});
