import { Observable } from 'rxjs';
import { Expense, ExpenseClassificationChange, ExpenseId, HouseholdRef } from '../../domain';
import { CreateExpenseCommand, ExpenseFilters, ExpensePage, ExpensePagination, ReclassifyExpenseCommand } from '../expense.models';

export interface ExpenseGateway {
  list(householdId: HouseholdRef, filters: ExpenseFilters, pagination: ExpensePagination): Observable<ExpensePage>;
  get(householdId: HouseholdRef, expenseId: ExpenseId): Observable<Expense>;
  create(householdId: HouseholdRef, command: CreateExpenseCommand): Observable<Expense>;
  void(householdId: HouseholdRef, expenseId: ExpenseId, reason: string): Observable<Expense>;
  reclassify(householdId: HouseholdRef, expenseId: ExpenseId, command: ReclassifyExpenseCommand): Observable<Expense>;
  classificationHistory(householdId: HouseholdRef, expenseId: ExpenseId): Observable<readonly ExpenseClassificationChange[]>;
}
