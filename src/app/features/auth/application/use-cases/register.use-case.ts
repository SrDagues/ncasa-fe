import { Observable } from 'rxjs';
import { RegistrationData, RegistrationResult } from '../../domain/auth.models';
import { AuthRepository } from '../ports/auth.repository';

export class RegisterUseCase {
  constructor(private readonly repository: Pick<AuthRepository, 'register'>) {}

  execute(data: RegistrationData): Observable<RegistrationResult> {
    return this.repository.register(data);
  }
}
