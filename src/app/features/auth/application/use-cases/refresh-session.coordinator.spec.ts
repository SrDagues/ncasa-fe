import { Observable, Subject, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { AuthenticatedSession } from '../../domain/auth.models';
import { AuthSessionState } from '../ports/auth-session-state';
import { RefreshSessionCoordinator } from './refresh-session.coordinator';

describe('RefreshSessionCoordinator', () => {
  const session: AuthenticatedSession = {
    accessToken: 'new-token', tokenType: 'Bearer', expiresIn: 900,
    user: { id: 1, email: 'user@example.com', roles: ['ROLE_USER'] },
  };

  it('should share one refresh between concurrent consumers', () => {
    const repository = new ControlledRefreshRepository();
    const state = new FakeState();
    const coordinator = new RefreshSessionCoordinator(repository, state);
    const received: AuthenticatedSession[] = [];

    for (let index = 0; index < 5; index += 1) {
      coordinator.refresh().subscribe((value) => received.push(value));
    }

    expect(repository.calls).toBe(1);
    repository.response.next(session);
    repository.response.complete();
    expect(received).toHaveLength(5);
    expect(state.authenticated).toEqual(session);
  });

  it('should allow a new refresh after the current one completes', () => {
    const repository = new ControlledRefreshRepository();
    const coordinator = new RefreshSessionCoordinator(repository, new FakeState());
    coordinator.refresh().subscribe();
    repository.response.next(session);
    repository.response.complete();

    coordinator.refresh().subscribe();

    expect(repository.calls).toBe(2);
  });

  it('should clear the session when refresh fails', () => {
    const state = new FakeState();
    const coordinator = new RefreshSessionCoordinator(
      { refresh: () => throwError(() => new Error('unauthorized')) },
      state,
    );

    coordinator.refresh().subscribe({ error: () => undefined });

    expect(state.anonymous).toBe(true);
  });
});

class ControlledRefreshRepository {
  calls = 0;
  response = new Subject<AuthenticatedSession>();

  refresh(): Observable<AuthenticatedSession> {
    this.calls += 1;
    return this.response;
  }
}

class FakeState implements AuthSessionState {
  authenticated: AuthenticatedSession | null = null;
  anonymous = false;
  setAuthenticated(session: AuthenticatedSession): void { this.authenticated = session; }
  setAnonymous(): void {
    this.authenticated = null;
    this.anonymous = true;
  }
}
