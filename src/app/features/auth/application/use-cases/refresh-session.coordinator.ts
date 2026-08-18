import { Observable, catchError, finalize, shareReplay, tap, throwError } from 'rxjs';
import { AuthenticatedSession } from '../../domain/auth.models';
import { AuthRepository } from '../ports/auth.repository';
import { AuthSessionState } from '../ports/auth-session-state';

export class RefreshSessionCoordinator {
  private inFlight: Observable<AuthenticatedSession> | null = null;

  constructor(
    private readonly repository: Pick<AuthRepository, 'refresh'>,
    private readonly sessionState: AuthSessionState,
  ) {}

  refresh(): Observable<AuthenticatedSession> {
    if (!this.inFlight) {
      this.inFlight = this.repository.refresh().pipe(
        tap((session) => this.sessionState.setAuthenticated(session)),
        catchError((error: unknown) => {
          this.sessionState.setAnonymous();
          return throwError(() => error);
        }),
        finalize(() => this.inFlight = null),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    }
    return this.inFlight;
  }
}
