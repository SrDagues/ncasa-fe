import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, afterEach, expect, it } from 'vitest';
import { HttpAuthRepository } from './http-auth.repository';
import {
  InvalidCredentialsError,
  EmailAlreadyRegisteredError,
  NetworkUnavailableError,
  SessionExpiredError,
  EmailAlreadyVerifiedError,
  EmailVerificationRequiredError,
  ExpiredEmailVerificationTokenError,
  InvalidEmailVerificationTokenError,
  VerificationRateLimitedError,
} from '../../application/auth.errors';

describe('HttpAuthRepository login', () => {
  let repository: HttpAuthRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    repository = new HttpAuthRepository(TestBed.inject(HttpClient), '/api');
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should authenticate through the web API without expecting a refresh token', () => {
    let session: unknown;

    repository.login({ email: 'user@example.com', password: 'password123' })
      .subscribe((result) => session = result);

    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: { id: 1, email: 'user@example.com', roles: ['ROLE_USER'] },
    });

    expect(session).toEqual({
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: { id: 1, email: 'user@example.com', roles: ['ROLE_USER'] },
    });
    expect(session).not.toHaveProperty('refreshToken');
  });

  it('should register an account through the web API and receive a pending result', () => {
    let result: unknown;

    repository.register({ email: 'user@example.com', password: 'password123' })
      .subscribe((value) => result = value);

    const request = http.expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(request.request.withCredentials).toBe(false);
    request.flush({ status: 'PENDING_EMAIL_VERIFICATION' },
      { status: 201, statusText: 'Created' });

    expect(result).toEqual({ status: 'PENDING_EMAIL_VERIFICATION' });
  });

  it('should translate a duplicate email into an application error', () => {
    let failure: unknown;
    repository.register({ email: 'user@example.com', password: 'password123' })
      .subscribe({ error: (error: unknown) => failure = error });

    http.expectOne('/api/auth/register').flush(null, { status: 409, statusText: 'Conflict' });

    expect(failure).toBeInstanceOf(EmailAlreadyRegisteredError);
  });

  it('should refresh the session through the HttpOnly cookie without a token body', () => {
    let session: unknown;

    repository.refresh().subscribe((result) => session = result);

    const request = http.expectOne('/api/auth/refresh');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      accessToken: 'new-access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: { id: 1, email: 'user@example.com', roles: ['ROLE_USER'] },
    });

    expect(session).toMatchObject({ accessToken: 'new-access-token' });
    expect(session).not.toHaveProperty('refreshToken');
  });

  it('should logout through the refresh cookie', () => {
    let completed = false;

    repository.logout().subscribe({ complete: () => completed = true });

    const request = http.expectOne('/api/auth/logout');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    expect(request.request.withCredentials).toBe(true);
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(completed).toBe(true);
  });

  it('should translate unauthorized login into invalid credentials', () => {
    let failure: unknown;
    repository.login({ email: 'user@example.com', password: 'wrong-password' })
      .subscribe({ error: (error: unknown) => failure = error });

    http.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(failure).toBeInstanceOf(InvalidCredentialsError);
  });

  it('should translate a pending email login into a verification-required error', () => {
    let failure: unknown;
    repository.login({ email: 'user@example.com', password: 'password123' })
      .subscribe({ error: (error: unknown) => failure = error });

    http.expectOne('/api/auth/login').flush(null, { status: 403, statusText: 'Forbidden' });

    expect(failure).toBeInstanceOf(EmailVerificationRequiredError);
  });

  it('should confirm email through the public endpoint', () => {
    let completed = false;
    repository.confirmEmail('raw-token').subscribe({ complete: () => completed = true });

    const request = http.expectOne('/api/auth/email-verification');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ token: 'raw-token' });
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it.each([
    [400, InvalidEmailVerificationTokenError],
    [409, EmailAlreadyVerifiedError],
    [410, ExpiredEmailVerificationTokenError],
  ] as const)('should translate confirmation status %s', (status, ExpectedError) => {
    let failure: unknown;
    repository.confirmEmail('raw-token').subscribe({ error: (error: unknown) => failure = error });

    http.expectOne('/api/auth/email-verification')
      .flush(null, { status, statusText: 'Verification rejected' });

    expect(failure).toBeInstanceOf(ExpectedError);
  });

  it('should request a neutral verification resend', () => {
    let completed = false;
    repository.resendEmailVerification('user@example.com')
      .subscribe({ complete: () => completed = true });

    const request = http.expectOne('/api/auth/email-verification/resend');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'user@example.com' });
    request.flush(null, { status: 202, statusText: 'Accepted' });

    expect(completed).toBe(true);
  });

  it('should retain Retry-After when a verification endpoint is rate limited', () => {
    let failure: unknown;
    repository.resendEmailVerification('user@example.com')
      .subscribe({ error: (error: unknown) => failure = error });

    http.expectOne('/api/auth/email-verification/resend').flush(null, {
      status: 429,
      statusText: 'Too Many Requests',
      headers: { 'Retry-After': '37' },
    });

    expect(failure).toBeInstanceOf(VerificationRateLimitedError);
    expect((failure as VerificationRateLimitedError).retryAfterSeconds).toBe(37);
  });

  it('should translate a refresh rejection into an expired session', () => {
    let failure: unknown;
    repository.refresh().subscribe({ error: (error: unknown) => failure = error });

    http.expectOne('/api/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(failure).toBeInstanceOf(SessionExpiredError);
  });

  it('should translate connection failures into network unavailable', () => {
    let failure: unknown;
    repository.login({ email: 'user@example.com', password: 'password123' })
      .subscribe({ error: (error: unknown) => failure = error });

    http.expectOne('/api/auth/login').error(new ProgressEvent('error'));

    expect(failure).toBeInstanceOf(NetworkUnavailableError);
  });

  it('should load the current user without leaking an API DTO', () => {
    let user: unknown;
    repository.me().subscribe((result) => user = result);

    const request = http.expectOne('/api/auth/me');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 1, email: 'user@example.com', roles: ['ROLE_USER'] });

    expect(user).toEqual({ id: 1, email: 'user@example.com', roles: ['ROLE_USER'] });
  });
});
