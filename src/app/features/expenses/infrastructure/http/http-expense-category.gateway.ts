import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ExpenseCategoryGateway } from '../../application/ports/expense-category.gateway';
import { ExpenseCategory, ExpenseCategoryId, HouseholdRef } from '../../domain';
import { mapExpenseCategories, mapExpenseCategory } from './expense-stage2-api.mapper';
import { normalizeExpenseHttpErrors } from './expense-http-errors';

export class HttpExpenseCategoryGateway implements ExpenseCategoryGateway {
  constructor(private readonly http: HttpClient, private readonly apiUrl: string) {}
  list(householdId: HouseholdRef, includeArchived: boolean): Observable<readonly ExpenseCategory[]> {
    return this.http.get<unknown>(this.collection(householdId), { params: { includeArchived } }).pipe(map(mapExpenseCategories), normalizeExpenseHttpErrors());
  }
  create(householdId: HouseholdRef, name: string) { return this.http.post<unknown>(this.collection(householdId), { name }).pipe(map(mapExpenseCategory), normalizeExpenseHttpErrors()); }
  rename(householdId: HouseholdRef, id: ExpenseCategoryId, name: string) { return this.http.put<unknown>(`${this.collection(householdId)}/${id}`, { name }).pipe(map(mapExpenseCategory), normalizeExpenseHttpErrors()); }
  archive(householdId: HouseholdRef, id: ExpenseCategoryId) { return this.http.post<unknown>(`${this.collection(householdId)}/${id}/archive`, {}).pipe(map(mapExpenseCategory), normalizeExpenseHttpErrors()); }
  private collection(householdId: HouseholdRef) { return `${this.apiUrl}/households/${householdId}/expense-categories`; }
}
