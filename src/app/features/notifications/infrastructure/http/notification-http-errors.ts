import { HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { NotificationApplicationError, NotificationErrorKind } from '../../application/notification.errors';

export const normalizeNotificationHttpErrors = <T>() => (source: Observable<T>): Observable<T> => source.pipe(catchError((failure: unknown) => {
  if (failure instanceof NotificationApplicationError) return throwError(() => failure);
  if (!(failure instanceof HttpErrorResponse)) {
    return throwError(() => new NotificationApplicationError('unexpected', 'Unexpected notification error'));
  }
  const kinds: Readonly<Record<number, NotificationErrorKind>> = {
    0: 'network', 400: 'validation', 401: 'unauthenticated', 403: 'forbidden', 404: 'not-found',
  };
  return throwError(() => new NotificationApplicationError(kinds[failure.status] ?? 'unexpected', failure.message));
}));
