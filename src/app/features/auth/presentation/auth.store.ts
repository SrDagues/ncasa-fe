import { Injectable, signal } from '@angular/core';
import { AuthenticatedSession, AuthenticationStatus, User } from '../domain/auth.models';
import { AuthSessionState } from '../application/ports/auth-session-state';

@Injectable()
export class AuthStore implements AuthSessionState {
  private readonly statusState = signal<AuthenticationStatus>('unknown');
  private readonly currentUserState = signal<User | null>(null);
  private readonly accessTokenState = signal<string | null>(null);

  readonly status = this.statusState.asReadonly();
  readonly currentUser = this.currentUserState.asReadonly();
  readonly accessToken = this.accessTokenState.asReadonly();

  setAuthenticated(session: AuthenticatedSession): void {
    this.accessTokenState.set(session.accessToken);
    this.currentUserState.set(session.user);
    this.statusState.set('authenticated');
  }

  setAnonymous(): void {
    this.accessTokenState.set(null);
    this.currentUserState.set(null);
    this.statusState.set('anonymous');
  }
}
