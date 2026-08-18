import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { AuthSessionState } from '../ports/auth-session-state';
import { AuthenticatedSession } from '../../domain/auth.models';
import { RestoreSessionUseCase } from './restore-session.use-case';

describe('RestoreSessionUseCase', () => {
  const session: AuthenticatedSession = {
    accessToken: 'restored-token', tokenType: 'Bearer', expiresIn: 900,
    user: { id: 1, email: 'user@example.com', roles: ['ROLE_USER'] },
  };

  it('should authenticate when the refresh cookie is valid', () => {
    const state = new FakeState();

    new RestoreSessionUseCase({ refresh: () => of(session) }, state)
      .execute().subscribe();

    expect(state.authenticated).toEqual(session);
    expect(state.anonymous).toBe(false);
  });

  it('should become anonymous when no session can be restored', () => {
    const state = new FakeState();

    new RestoreSessionUseCase(
      { refresh: () => throwError(() => new Error('unauthorized')) },
      state,
    ).execute().subscribe();

    expect(state.authenticated).toBeNull();
    expect(state.anonymous).toBe(true);
  });
});

class FakeState implements AuthSessionState {
  authenticated: AuthenticatedSession | null = null;
  anonymous = false;
  setAuthenticated(session: AuthenticatedSession): void { this.authenticated = session; }
  setAnonymous(): void { this.anonymous = true; }
}
