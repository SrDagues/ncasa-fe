import { Observable } from 'rxjs';
import { Expense, ExpenseId, HouseholdRef } from '../../domain';
import { CreateExpenseCommand, ExpenseFilters, ExpensePage, ExpensePagination } from '../expense.models';

export interface ExpenseGateway {
  list(householdId: HouseholdRef, filters: ExpenseFilters, pagination: ExpensePagination): Observable<ExpensePage>;
  get(householdId: HouseholdRef, expenseId: ExpenseId): Observable<Expense>;
  create(householdId: HouseholdRef, command: CreateExpenseCommand): Observable<Expense>;
  void(householdId: HouseholdRef, expenseId: ExpenseId, reason: string): Observable<Expense>;
}
