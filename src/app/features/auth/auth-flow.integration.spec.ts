import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshSessionCoordinator } from './application/use-cases/refresh-session.coordinator';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { ConfirmEmailUseCase } from './application/use-cases/confirm-email.use-case';
import { ResendEmailVerificationUseCase } from './application/use-cases/resend-email-verification.use-case';
import { authInterceptor } from './infrastructure/http/auth.interceptor';
import { HttpAuthRepository } from './infrastructure/http/http-auth.repository';
import { AuthStore } from './presentation/auth.store';

describe('web authentication flow', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let repository: HttpAuthRepository;
  let store: AuthStore;
  let login: LoginUseCase;
  let register: RegisterUseCase;
  let confirmEmail: ConfirmEmailUseCase;
  let resendEmailVerification: ResendEmailVerificationUseCase;
  let logout: LogoutUseCase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: HttpAuthRepository,
          useFactory: (httpClient: HttpClient) => new HttpAuthRepository(httpClient, '/api'),
          deps: [HttpClient],
        },
        {
          provide: RefreshSessionCoordinator,
          useFactory: (auth: HttpAuthRepository, state: AuthStore) =>
            new RefreshSessionCoordinator(auth, state),
          deps: [HttpAuthRepository, AuthStore],
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    repository = TestBed.inject(HttpAuthRepository);
    store = TestBed.inject(AuthStore);
    login = new LoginUseCase(repository, store);
    register = new RegisterUseCase(repository);
    confirmEmail = new ConfirmEmailUseCase(repository);
    resendEmailVerification = new ResendEmailVerificationUseCase(repository);
    logout = new LogoutUseCase(repository, store);
  });

  afterEach(() => http.verify());

  it('should login, renew an expired access token and logout', () => {
    login.execute({ email: 'user@example.com', password: 'password123' }).subscribe();
    http.expectOne('/api/auth/login').flush(session('access-token'));
    expect(store.status()).toBe('authenticated');

    const responses: unknown[] = [];
    client.get('/api/protected').subscribe((response) => responses.push(response));
    const protectedRequest = http.expectOne('/api/protected');
    expect(protectedRequest.request.headers.get('Authorization')).toBe('Bearer access-token');
    protectedRequest.flush(null, { status: 401, statusText: 'Unauthorized' });

    const refreshRequest = http.expectOne('/api/auth/refresh');
    expect(refreshRequest.request.body).toBeNull();
    refreshRequest.flush(session('renewed-token'));
    const retry = http.expectOne('/api/protected');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer renewed-token');
    retry.flush({ ok: true });
    expect(responses).toEqual([{ ok: true }]);

    logout.execute().subscribe();
    http.expectOne('/api/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    expect(store.status()).toBe('anonymous');
    expect(store.accessToken()).toBeNull();
  });

  it('should register an account without creating an authenticated session', () => {
    store.setAnonymous();
    register.execute({ email: 'user@example.com', password: 'password123' }).subscribe();

    const registration = http.expectOne('/api/auth/register');
    expect(registration.request.method).toBe('POST');
    expect(registration.request.withCredentials).toBe(false);
    expect(registration.request.headers.has('Authorization')).toBe(false);
    registration.flush(
      { status: 'PENDING_EMAIL_VERIFICATION' },
      { status: 201, statusText: 'Created' },
    );

    expect(store.status()).toBe('anonymous');
    client.get('/api/protected').subscribe();
    const protectedRequest = http.expectOne('/api/protected');
    expect(protectedRequest.request.headers.has('Authorization')).toBe(false);
    protectedRequest.flush({ ok: true });
  });

  it('should resend and confirm an email without attaching authentication', () => {
    resendEmailVerification.execute('user@example.com').subscribe();
    const resend = http.expectOne('/api/auth/email-verification/resend');
    expect(resend.request.method).toBe('POST');
    expect(resend.request.body).toEqual({ email: 'user@example.com' });
    expect(resend.request.headers.has('Authorization')).toBe(false);
    resend.flush(null, { status: 202, statusText: 'Accepted' });

    confirmEmail.execute('opaque-token').subscribe();
    const confirmation = http.expectOne('/api/auth/email-verification');
    expect(confirmation.request.method).toBe('POST');
    expect(confirmation.request.body).toEqual({ token: 'opaque-token' });
    expect(confirmation.request.headers.has('Authorization')).toBe(false);
    confirmation.flush(null, { status: 204, statusText: 'No Content' });

    expect(store.status()).toBe('unknown');
  });
});

function session(accessToken: string) {
  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: 900,
    user: { id: 1, email: 'user@example.com', roles: ['ROLE_USER'] },
  } as const;
}
