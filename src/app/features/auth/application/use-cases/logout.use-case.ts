import { Observable, catchError, finalize, of } from 'rxjs';
import { AuthRepository } from '../ports/auth.repository';
import { AuthSessionState } from '../ports/auth-session-state';

export class LogoutUseCase {
  constructor(
    private readonly repository: Pick<AuthRepository, 'logout'>,
    private readonly sessionState: AuthSessionState,
  ) {}

  execute(): Observable<void> {
    return this.repository.logout().pipe(
      catchError(() => of(undefined)),
      finalize(() => this.sessionState.setAnonymous()),
    );
  }
}
