import { Observable, catchError, tap, throwError } from 'rxjs';
import { AuthenticatedSession, LoginCredentials } from '../../domain/auth.models';
import { AuthRepository } from '../ports/auth.repository';
import { AuthSessionState } from '../ports/auth-session-state';

export class LoginUseCase {
  constructor(
    private readonly repository: Pick<AuthRepository, 'login'>,
    private readonly sessionState: AuthSessionState,
  ) {}

  execute(credentials: LoginCredentials): Observable<AuthenticatedSession> {
    return this.repository.login(credentials).pipe(
      tap((session) => this.sessionState.setAuthenticated(session)),
      catchError((error: unknown) => {
        this.sessionState.setAnonymous();
        return throwError(() => error);
      }),
    );
  }
}
