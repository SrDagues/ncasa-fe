import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ExpenseApplicationError, ExpenseErrorKind } from '../../application/expense.errors';
import { CreateExpenseCommand, ExpenseFilters, ExpensePage, ExpensePagination } from '../../application/expense.models';
import { ExpenseGateway } from '../../application/ports/expense.gateway';
import { Expense, ExpenseId, HouseholdRef } from '../../domain';
import { mapExpense, mapExpensePage } from './expense-api.mapper';

export class HttpExpenseGateway implements ExpenseGateway {
  constructor(private readonly http: HttpClient, private readonly apiUrl: string) {}

  list(householdId: HouseholdRef, filters: ExpenseFilters, pagination: ExpensePagination): Observable<ExpensePage> {
    let params = new HttpParams().set('status', filters.status).set('page', pagination.page).set('size', pagination.size);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    return this.http.get<unknown>(this.collection(householdId), { params }).pipe(map(mapExpensePage), this.errors());
  }

  get(householdId: HouseholdRef, expenseId: ExpenseId): Observable<Expense> {
    return this.http.get<unknown>(`${this.collection(householdId)}/${expenseId}`).pipe(map(mapExpense), this.errors());
  }

  create(householdId: HouseholdRef, command: CreateExpenseCommand): Observable<Expense> {
    const split = command.split.type === 'EQUAL'
      ? { type: 'EQUAL', memberIds: command.split.memberIds }
      : { type: 'EXACT', allocations: command.split.allocations.map(item => ({ memberId: item.memberId, amount: item.amount.toDecimal() })) };
    return this.http.post<unknown>(this.collection(householdId), {
      description: command.description, amount: command.amount.toDecimal(), currency: command.amount.currency,
      expenseDate: command.expenseDate, payerMemberId: command.payerMemberId, split,
    }).pipe(map(mapExpense), this.errors());
  }

  void(householdId: HouseholdRef, expenseId: ExpenseId, reason: string): Observable<Expense> {
    return this.http.post<unknown>(`${this.collection(householdId)}/${expenseId}/void`, { reason }).pipe(map(mapExpense), this.errors());
  }

  private collection(householdId: HouseholdRef): string { return `${this.apiUrl}/households/${householdId}/expenses`; }

  private errors<T>(): (source: Observable<T>) => Observable<T> {
    return source => source.pipe(catchError((failure: unknown) => throwError(() => this.normalize(failure))));
  }

  private normalize(failure: unknown): ExpenseApplicationError {
    if (failure instanceof ExpenseApplicationError) return failure;
    if (!(failure instanceof HttpErrorResponse)) return new ExpenseApplicationError('unexpected', 'Unexpected error');
    const kinds: Readonly<Record<number, ExpenseErrorKind>> = {
      0: 'network', 400: 'validation', 401: 'unauthenticated', 403: 'forbidden', 404: 'not-found', 409: 'conflict',
    };
    const body = typeof failure.error === 'object' && failure.error !== null ? failure.error as Json : {};
    const fields = typeof body['fields'] === 'object' && body['fields'] !== null ? body['fields'] as Readonly<Record<string, string>> : {};
    return new ExpenseApplicationError(kinds[failure.status] ?? 'unexpected',
      typeof body['message'] === 'string' ? body['message'] : failure.message, fields);
  }
}

type Json = Readonly<Record<string, unknown>>;
