import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import {
  AuthenticatedSession,
  LoginCredentials,
  RegistrationData,
  User,
} from '../../domain/auth.models';
import { AuthRepository } from '../../application/ports/auth.repository';
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  NetworkUnavailableError,
  SessionExpiredError,
  UnexpectedAuthenticationError,
} from '../../application/auth.errors';

interface AuthenticationResponseDto {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
  readonly user: {
    readonly id: number;
    readonly email: string;
    readonly roles: readonly string[];
  };
}

export class HttpAuthRepository implements AuthRepository {
  constructor(
    private readonly http: HttpClient,
    private readonly apiUrl: string,
  ) {}

  login(credentials: LoginCredentials): Observable<AuthenticatedSession> {
    return this.http.post<AuthenticationResponseDto>(
      `${this.apiUrl}/auth/login`,
      credentials,
      { withCredentials: true },
    ).pipe(
      map(toAuthenticatedSession),
      catchError((error: unknown) => throwError(() => translateError(error, 'login'))),
    );
  }

  register(data: RegistrationData): Observable<AuthenticatedSession> {
    return this.http.post<AuthenticationResponseDto>(
      `${this.apiUrl}/auth/register`,
      data,
      { withCredentials: true },
    ).pipe(
      map(toAuthenticatedSession),
      catchError((error: unknown) => throwError(() => translateError(error, 'register'))),
    );
  }

  refresh(): Observable<AuthenticatedSession> {
    return this.http.post<AuthenticationResponseDto>(
      `${this.apiUrl}/auth/refresh`,
      null,
      { withCredentials: true },
    ).pipe(
      map(toAuthenticatedSession),
      catchError((error: unknown) => throwError(() => translateError(error, 'refresh'))),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/auth/logout`,
      null,
      { withCredentials: true },
    );
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`).pipe(
      map((user) => ({ ...user, roles: [...user.roles] })),
    );
  }
}

function translateError(error: unknown, operation: 'login' | 'register' | 'refresh'): Error {
  if (!(error instanceof HttpErrorResponse)) return new UnexpectedAuthenticationError();
  if (error.status === 0) return new NetworkUnavailableError();
  if (error.status === 409 && operation === 'register') return new EmailAlreadyRegisteredError();
  if (error.status === 401) {
    return operation === 'login' ? new InvalidCredentialsError() : new SessionExpiredError();
  }
  return new UnexpectedAuthenticationError();
}

function toAuthenticatedSession(dto: AuthenticationResponseDto): AuthenticatedSession {
  return {
    accessToken: dto.accessToken,
    tokenType: dto.tokenType,
    expiresIn: dto.expiresIn,
    user: {
      id: dto.user.id,
      email: dto.user.email,
      roles: [...dto.user.roles],
    },
  };
}
