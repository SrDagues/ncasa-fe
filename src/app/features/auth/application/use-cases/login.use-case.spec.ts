import { Observable, of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { AuthRepository } from '../ports/auth.repository';
import { AuthSessionState } from '../ports/auth-session-state';
import { AuthenticatedSession, LoginCredentials, User } from '../../domain/auth.models';
import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  const session: AuthenticatedSession = {
    accessToken: 'access-token',
    tokenType: 'Bearer',
    expiresIn: 900,
    user: { id: 1, email: 'user@example.com', roles: ['ROLE_USER'] },
  };

  it('should publish the authenticated session when credentials are valid', () => {
    const state = new FakeSessionState();
    const useCase = new LoginUseCase(new FakeAuthRepository(of(session)), state);

    useCase.execute({ email: 'user@example.com', password: 'password123' }).subscribe();

    expect(state.authenticated).toEqual(session);
    expect(state.anonymous).toBe(false);
  });

  it('should clear session state and preserve the error when login fails', () => {
    const failure = new Error('invalid credentials');
    const state = new FakeSessionState();
    const useCase = new LoginUseCase(
      new FakeAuthRepository(throwError(() => failure)),
      state,
    );
    let received: unknown;

    useCase.execute({ email: 'user@example.com', password: 'wrong-password' })
      .subscribe({ error: (error: unknown) => received = error });

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

class FakeAuthRepository implements AuthRepository {
  constructor(private readonly loginResult: Observable<AuthenticatedSession>) {}

  login(_credentials: LoginCredentials): Observable<AuthenticatedSession> {
    return this.loginResult;
  }

  register(): Observable<AuthenticatedSession> { return throwError(() => new Error('unused')); }
  refresh(): Observable<AuthenticatedSession> { return throwError(() => new Error('unused')); }
  logout(): Observable<void> { return throwError(() => new Error('unused')); }
  me(): Observable<User> { return throwError(() => new Error('unused')); }
}
