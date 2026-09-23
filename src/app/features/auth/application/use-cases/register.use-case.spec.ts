import { Observable, of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { RegistrationData, RegistrationResult } from '../../domain/auth.models';
import { AuthRepository } from '../ports/auth.repository';
import { RegisterUseCase } from './register.use-case';

describe('RegisterUseCase', () => {
  const registration: RegistrationData = {
    email: 'user@example.com',
    password: 'password123',
  };
  const result: RegistrationResult = { status: 'PENDING_EMAIL_VERIFICATION' };

  it('should return a pending verification result without creating a session', () => {
    const useCase = new RegisterUseCase(new FakeRepository(of(result)));
    let received: RegistrationResult | undefined;

    useCase.execute(registration).subscribe(value => received = value);

    expect(received).toEqual(result);
  });

  it('should preserve registration errors', () => {
    const failure = new Error('email already registered');
    const useCase = new RegisterUseCase(new FakeRepository(throwError(() => failure)));
    let received: unknown;

    useCase.execute(registration).subscribe({ error: (error: unknown) => received = error });

    expect(received).toBe(failure);
  });
});

class FakeRepository implements Pick<AuthRepository, 'register'> {
  constructor(private readonly result: Observable<RegistrationResult>) {}

  register(_data: RegistrationData): Observable<RegistrationResult> {
    return this.result;
  }
}
