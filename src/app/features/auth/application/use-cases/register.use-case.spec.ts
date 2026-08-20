import { Observable, of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { AuthenticatedSession, RegistrationData } from '../../domain/auth.models';
import { AuthSessionState } from '../ports/auth-session-state';
import { AuthRepository } from '../ports/auth.repository';
import { RegisterUseCase } from './register.use-case';

describe('RegisterUseCase', () => {
  const registration: RegistrationData = {
    email: 'user@example.com',
    password: 'password123',
  };
  const session: AuthenticatedSession = {
    accessToken: 'access-token',
    tokenType: 'Bearer',
    expiresIn: 900,
    user: { id: 1, email: registration.email, roles: ['ROLE_USER'] },
  };

  it('should publish the authenticated session after registration', () => {
    const state = new FakeSessionState();
    const useCase = new RegisterUseCase(new FakeRepository(of(session)), state);

    useCase.execute(registration).subscribe();

    expect(state.authenticated).toEqual(session);
    expect(state.anonymous).toBe(false);
  });

  it('should clear session state and preserve registration errors', () => {
    const failure = new Error('email already registered');
    const state = new FakeSessionState();
    const useCase = new RegisterUseCase(
      new FakeRepository(throwError(() => failure)),
      state,
    );
    let received: unknown;

    useCase.execute(registration).subscribe({ error: (error: unknown) => received = error });

    expect(state.anonymous).toBe(true);
    expect(state.authenticated).toBeNull();
    expect(received).toBe(failure);
  });
});

class FakeSessionState implements AuthSessionState {
  authenticated: AuthenticatedSession | null = null;
  anonymous = false;

  setAuthenticated(session: AuthenticatedSession): void {
    this.authenticated = session;
  }

  setAnonymous(): void {
    this.authenticated = null;
    this.anonymous = true;
  }
}

class FakeRepository implements Pick<AuthRepository, 'register'> {
  constructor(private readonly result: Observable<AuthenticatedSession>) {}

  register(_data: RegistrationData): Observable<AuthenticatedSession> {
    return this.result;
  }
}
