import { Observable, catchError, of, tap } from 'rxjs';
import { AuthenticatedSession } from '../../domain/auth.models';
import { AuthRepository } from '../ports/auth.repository';
import { AuthSessionState } from '../ports/auth-session-state';

export class RestoreSessionUseCase {
  constructor(
    private readonly repository: Pick<AuthRepository, 'refresh'>,
    private readonly sessionState: AuthSessionState,
  ) {}

  execute(): Observable<AuthenticatedSession | null> {
    return this.repository.refresh().pipe(
      tap((session) => this.sessionState.setAuthenticated(session)),
      catchError(() => {
        this.sessionState.setAnonymous();
        return of(null);
      }),
    );
  }
}
