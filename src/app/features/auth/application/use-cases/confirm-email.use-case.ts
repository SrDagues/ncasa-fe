import { Observable } from 'rxjs';
import { AuthRepository } from '../ports/auth.repository';

export class ConfirmEmailUseCase {
  constructor(private readonly repository: Pick<AuthRepository, 'confirmEmail'>) {}

  execute(token: string): Observable<void> {
    return this.repository.confirmEmail(token);
  }
}
