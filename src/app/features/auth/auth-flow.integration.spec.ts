import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshSessionCoordinator } from './application/use-cases/refresh-session.coordinator';
import { authInterceptor } from './infrastructure/http/auth.interceptor';
import { HttpAuthRepository } from './infrastructure/http/http-auth.repository';
import { AuthStore } from './presentation/auth.store';

describe('web authentication flow', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let repository: HttpAuthRepository;
  let store: AuthStore;
  let login: LoginUseCase;
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
});

function session(accessToken: string) {
  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: 900,
    user: { id: 1, email: 'user@example.com', roles: ['ROLE_USER'] },
  } as const;
}
