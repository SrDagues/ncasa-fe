import { AuthenticatedSession } from '../../domain/auth.models';

export interface AuthSessionState {
  setAuthenticated(session: AuthenticatedSession): void;
  setAnonymous(): void;
}
