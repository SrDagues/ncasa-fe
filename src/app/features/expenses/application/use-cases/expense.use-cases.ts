import { map, Observable } from 'rxjs';
import { Expense, ExpenseId, HouseholdRef } from '../../domain';
import { CreateExpenseCommand, ExpenseFilters, ExpensePage, ExpensePagination, RecentExpenseSummary } from '../expense.models';
import { ExpenseGateway } from '../ports/expense.gateway';

export class ListExpensesUseCase {
  constructor(private readonly gateway: ExpenseGateway) {}
  execute(householdId: HouseholdRef, filters: ExpenseFilters, pagination: ExpensePagination): Observable<ExpensePage> {
    if (pagination.page < 0 || pagination.size < 1 || pagination.size > 100) throw new Error('Invalid pagination');
    if (filters.from && filters.to && filters.from > filters.to) throw new Error('Invalid date range');
    return this.gateway.list(householdId, filters, pagination);
  }
}

export class GetExpenseUseCase {
  constructor(private readonly gateway: ExpenseGateway) {}
  execute(householdId: HouseholdRef, expenseId: ExpenseId): Observable<Expense> { return this.gateway.get(householdId, expenseId); }
}

export class CreateExpenseUseCase {
  constructor(private readonly gateway: ExpenseGateway) {}
  execute(householdId: HouseholdRef, command: CreateExpenseCommand): Observable<Expense> {
    return this.gateway.create(householdId, { ...command, description: command.description.trim() });
  }
}

export class VoidExpenseUseCase {
  constructor(private readonly gateway: ExpenseGateway) {}
  execute(householdId: HouseholdRef, expenseId: ExpenseId, reason: string): Observable<Expense> {
    return this.gateway.void(householdId, expenseId, reason.trim());
  }
}

export class ListRecentExpensesUseCase {
  constructor(private readonly listExpenses: ListExpensesUseCase) {}
  execute(householdId: HouseholdRef, limit = 4): Observable<readonly RecentExpenseSummary[]> {
    return this.listExpenses.execute(householdId, { status: 'CONFIRMED' }, { page: 0, size: limit }).pipe(
      map(page => page.items.map(({ id, householdId: scope, payerMemberId, description, expenseDate, amount, status }) =>
        ({ id, householdId: scope, payerMemberId, description, expenseDate, amount, status }))),
    );
  }
}
