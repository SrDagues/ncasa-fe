import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, afterEach, expect, it } from 'vitest';
import { HttpAuthRepository } from './http-auth.repository';
import {
  InvalidCredentialsError,
  NetworkUnavailableError,
  SessionExpiredError,
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
