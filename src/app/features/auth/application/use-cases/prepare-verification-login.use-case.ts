import { Observable, tap } from 'rxjs';
import { AuthRepository } from '../ports/auth.repository';
import { AuthSessionState } from '../ports/auth-session-state';

export class PrepareVerificationLoginUseCase {
  constructor(
    private readonly repository: Pick<AuthRepository, 'logout'>,
    private readonly state: AuthSessionState,
  ) {}

  execute(): Observable<void> {
    return this.repository.logout().pipe(tap(() => this.state.setAnonymous()));
  }
}
