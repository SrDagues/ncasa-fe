import { HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { ExpenseApplicationError, ExpenseErrorKind } from '../../application/expense.errors';

export const normalizeExpenseHttpErrors = <T>() => (source: Observable<T>): Observable<T> => source.pipe(catchError((failure: unknown) => {
  if (failure instanceof ExpenseApplicationError) return throwError(() => failure);
  if (!(failure instanceof HttpErrorResponse)) return throwError(() => new ExpenseApplicationError('unexpected', 'Unexpected error'));
  const kinds: Readonly<Record<number, ExpenseErrorKind>> = { 0: 'network', 400: 'validation', 401: 'unauthenticated', 403: 'forbidden', 404: 'not-found', 409: 'conflict' };
  const body = typeof failure.error === 'object' && failure.error !== null ? failure.error as Readonly<Record<string, unknown>> : {};
  const fields = typeof body['fields'] === 'object' && body['fields'] !== null ? body['fields'] as Readonly<Record<string, string>> : {};
  return throwError(() => new ExpenseApplicationError(kinds[failure.status] ?? 'unexpected', typeof body['message'] === 'string' ? body['message'] : failure.message, fields));
}));
