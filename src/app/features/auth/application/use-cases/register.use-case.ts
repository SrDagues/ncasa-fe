import { Observable, catchError, tap, throwError } from 'rxjs';
import { AuthenticatedSession, RegistrationData } from '../../domain/auth.models';
import { AuthRepository } from '../ports/auth.repository';
import { AuthSessionState } from '../ports/auth-session-state';

export class RegisterUseCase {
  constructor(
    private readonly repository: Pick<AuthRepository, 'register'>,
    private readonly sessionState: AuthSessionState,
  ) {}

  execute(data: RegistrationData): Observable<AuthenticatedSession> {
    return this.repository.register(data).pipe(
      tap((session) => this.sessionState.setAuthenticated(session)),
      catchError((error: unknown) => {
        this.sessionState.setAnonymous();
        return throwError(() => error);
      }),
    );
  }
}
