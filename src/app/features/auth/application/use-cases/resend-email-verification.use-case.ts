import { Observable } from 'rxjs';
import { AuthRepository } from '../ports/auth.repository';

export class ResendEmailVerificationUseCase {
  constructor(private readonly repository: Pick<AuthRepository, 'resendEmailVerification'>) {}

  execute(email: string): Observable<void> {
    return this.repository.resendEmailVerification(email);
  }
}
