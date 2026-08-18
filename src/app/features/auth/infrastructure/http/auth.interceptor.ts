import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../../presentation/auth.store';
import { RefreshSessionCoordinator } from '../../application/use-cases/refresh-session.coordinator';

const publicSessionEndpoints = /\/api\/auth\/(login|refresh|logout)$/;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const store = inject(AuthStore);
  const refreshSessions = inject(RefreshSessionCoordinator);
  const isSessionEndpoint = publicSessionEndpoints.test(request.url);
  const hasExplicitAuthorization = request.headers.has('Authorization');
  const accessToken = store.accessToken();
  const authenticatedRequest = accessToken && !hasExplicitAuthorization && !isSessionEndpoint
    ? request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)
          || error.status !== 401
          || isSessionEndpoint
          || hasExplicitAuthorization) {
        return throwError(() => error);
      }
      return refreshSessions.refresh().pipe(
        switchMap((session) => next(request.clone({
          setHeaders: { Authorization: `Bearer ${session.accessToken}` },
        }))),
      );
    }),
  );
};
