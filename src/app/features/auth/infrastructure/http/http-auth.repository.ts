import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import {
  AuthenticatedSession,
  LoginCredentials,
  RegistrationData,
  RegistrationResult,
  User,
} from '../../domain/auth.models';
import { AuthRepository } from '../../application/ports/auth.repository';
import {
  EmailAlreadyRegisteredError,
  EmailAlreadyVerifiedError,
  EmailVerificationRequiredError,
  ExpiredEmailVerificationTokenError,
  InvalidCredentialsError,
  InvalidEmailVerificationTokenError,
  NetworkUnavailableError,
  SessionExpiredError,
  UnexpectedAuthenticationError,
  VerificationRateLimitedError,
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

interface RegistrationResponseDto {
  readonly status: 'PENDING_EMAIL_VERIFICATION';
}

type AuthenticationOperation =
  | 'login'
  | 'register'
  | 'refresh'
  | 'confirm-email'
  | 'resend-email-verification';

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

  register(data: RegistrationData): Observable<RegistrationResult> {
    return this.http.post<RegistrationResponseDto>(
      `${this.apiUrl}/auth/register`,
      data,
    ).pipe(
      map((response) => ({ status: response.status })),
      catchError((error: unknown) => throwError(() => translateError(error, 'register'))),
    );
  }

  confirmEmail(token: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/email-verification`, { token }).pipe(
      catchError((error: unknown) => throwError(() => translateError(error, 'confirm-email'))),
    );
  }

  resendEmailVerification(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/email-verification/resend`, { email }).pipe(
      catchError((error: unknown) =>
        throwError(() => translateError(error, 'resend-email-verification'))),
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

function translateError(error: unknown, operation: AuthenticationOperation): Error {
  if (!(error instanceof HttpErrorResponse)) return new UnexpectedAuthenticationError();
  if (error.status === 0) return new NetworkUnavailableError();
  if (error.status === 409 && operation === 'register') return new EmailAlreadyRegisteredError();
  if (error.status === 403 && operation === 'login') return new EmailVerificationRequiredError();
  if (operation === 'confirm-email') {
    if (error.status === 400) return new InvalidEmailVerificationTokenError();
    if (error.status === 409) return new EmailAlreadyVerifiedError();
    if (error.status === 410) return new ExpiredEmailVerificationTokenError();
  }
  if (error.status === 429
      && (operation === 'confirm-email' || operation === 'resend-email-verification')) {
    return new VerificationRateLimitedError(retryAfterSeconds(error));
  }
  if (error.status === 401) {
    return operation === 'login' ? new InvalidCredentialsError() : new SessionExpiredError();
  }
  return new UnexpectedAuthenticationError();
}

function retryAfterSeconds(error: HttpErrorResponse): number {
  const parsed = Number.parseInt(error.headers.get('Retry-After') ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60;
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
