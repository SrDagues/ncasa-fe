import { Observable } from 'rxjs';
import { ExpenseCategory, ExpenseCategoryId, HouseholdRef } from '../../domain';

export interface ExpenseCategoryGateway {
  list(householdId: HouseholdRef, includeArchived: boolean): Observable<readonly ExpenseCategory[]>;
  create(householdId: HouseholdRef, name: string): Observable<ExpenseCategory>;
  rename(householdId: HouseholdRef, categoryId: ExpenseCategoryId, name: string): Observable<ExpenseCategory>;
  archive(householdId: HouseholdRef, categoryId: ExpenseCategoryId): Observable<ExpenseCategory>;
}
