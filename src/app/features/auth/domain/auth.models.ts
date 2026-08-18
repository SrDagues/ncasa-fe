export interface User {
  readonly id: number;
  readonly email: string;
  readonly roles: readonly string[];
}

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export interface AuthenticatedSession {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
  readonly user: User;
}

export type AuthenticationStatus = 'unknown' | 'authenticated' | 'anonymous';
