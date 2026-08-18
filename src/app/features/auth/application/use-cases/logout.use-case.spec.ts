import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { AuthSessionState } from '../ports/auth-session-state';
import { AuthenticatedSession } from '../../domain/auth.models';
import { LogoutUseCase } from './logout.use-case';

describe('LogoutUseCase', () => {
  it('should clear local state after server logout', () => {
    const state = new FakeState();

    new LogoutUseCase({ logout: () => of(undefined) }, state).execute().subscribe();

    expect(state.anonymous).toBe(true);
  });

  it('should clear local state even when the server request fails', () => {
    const state = new FakeState();
    let completed = false;

    new LogoutUseCase(
      { logout: () => throwError(() => new Error('network')) },
      state,
    ).execute().subscribe({ complete: () => completed = true });

    expect(state.anonymous).toBe(true);
    expect(completed).toBe(true);
  });
});

class FakeState implements AuthSessionState {
  anonymous = false;
  setAuthenticated(_session: AuthenticatedSession): void {}
  setAnonymous(): void { this.anonymous = true; }
}
