import { firstValueFrom, Observable, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ExpenseGateway } from '../ports/expense.gateway';
import { CreateExpenseUseCase, ListExpensesUseCase, ListRecentExpensesUseCase, VoidExpenseUseCase } from './expense.use-cases';
import { Expense, Money } from '../../domain';

const expense: Expense = {
  id: 'e1', householdId: 'h1', createdByMemberId: 'm1', payerMemberId: 'm1',
  amount: Money.fromDecimal('10.00', 'EUR'), description: 'Compra', expenseDate: '2026-08-20',
  splitType: 'EQUAL', allocations: [{ memberId: 'm1', amount: Money.fromDecimal('10.00', 'EUR') }],
  status: 'CONFIRMED', source: 'MANUAL', voidReason: null, createdAt: '2026-08-20T10:00:00Z',
  updatedAt: '2026-08-20T10:00:00Z', voidedAt: null, version: 0,
};

const gateway = (): ExpenseGateway => ({
  list: vi.fn(() => of({ items: [expense], page: 0, size: 20, totalElements: 1, totalPages: 1 })),
  get: vi.fn(() => of(expense)), create: vi.fn(() => of(expense)), void: vi.fn(() => of({ ...expense, status: 'VOIDED' as const })),
});

describe('expense use cases', () => {
  it('lists recent confirmed expenses through the query port', async () => {
    const port = gateway();
    const result = await firstValueFrom(new ListRecentExpensesUseCase(new ListExpensesUseCase(port)).execute('h1', 4));
    expect(result).toHaveLength(1);
    expect(port.list).toHaveBeenCalledWith('h1', { status: 'CONFIRMED' }, { page: 0, size: 4 });
  });

  it('normalizes descriptions and void reasons before commands leave the application', async () => {
    const port = gateway();
    await firstValueFrom(new CreateExpenseUseCase(port).execute('h1', {
      description: ' Compra ', amount: Money.fromDecimal('10', 'EUR'), expenseDate: '2026-08-20', payerMemberId: 'm1',
      split: { type: 'EQUAL', memberIds: ['m1'] },
    }));
    await firstValueFrom(new VoidExpenseUseCase(port).execute('h1', 'e1', ' Error '));
    expect(port.create).toHaveBeenCalledWith('h1', expect.objectContaining({ description: 'Compra' }));
    expect(port.void).toHaveBeenCalledWith('h1', 'e1', 'Error');
  });
});
