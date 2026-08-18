import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Observable, Subject } from 'rxjs';
import { AuthStore } from '../../presentation/auth.store';
import { AuthenticatedSession } from '../../domain/auth.models';
import { RefreshSessionCoordinator } from '../../application/use-cases/refresh-session.coordinator';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let store: AuthStore;
  let refreshRepository: ControlledRefreshRepository;

  beforeEach(() => {
    refreshRepository = new ControlledRefreshRepository();
    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        {
          provide: RefreshSessionCoordinator,
          useFactory: (state: AuthStore) => new RefreshSessionCoordinator(refreshRepository, state),
          deps: [AuthStore],
        },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AuthStore);
  });

  afterEach(() => http.verify());

  it('should add the access token to protected requests', () => {
    authenticate(store);

    client.get('/api/auth/me').subscribe();

    expect(http.expectOne('/api/auth/me').request.headers.get('Authorization'))
      .toBe('Bearer access-token');
  });

  it('should not add authorization without an access token', () => {
    client.get('/api/auth/me').subscribe();

    expect(http.expectOne('/api/auth/me').request.headers.has('Authorization')).toBe(false);
  });

  it.each(['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/logout'])(
    'should not add authorization to %s',
    (url) => {
      authenticate(store);

      client.post(url, {}).subscribe();

      expect(http.expectOne(url).request.headers.has('Authorization')).toBe(false);
    },
  );

  it('should preserve an explicit authorization header', () => {
    authenticate(store);

    client.get('/api/resource', { headers: { Authorization: 'Custom credential' } }).subscribe();

    expect(http.expectOne('/api/resource').request.headers.get('Authorization'))
      .toBe('Custom credential');
  });

  it('should perform one refresh and retry concurrent unauthorized requests', () => {
    authenticate(store);
    const responses: unknown[] = [];
    for (let index = 0; index < 5; index += 1) {
      client.get(`/api/resource/${index}`).subscribe((response) => responses.push(response));
    }
    for (let index = 0; index < 5; index += 1) {
      http.expectOne(`/api/resource/${index}`).flush(null, { status: 401, statusText: 'Unauthorized' });
    }

    expect(refreshRepository.calls).toBe(1);
    refreshRepository.response.next({
      accessToken: 'new-token', tokenType: 'Bearer', expiresIn: 900,
      user: { id: 1, email: 'user@example.com', roles: ['ROLE_USER'] },
    });
    refreshRepository.response.complete();
    for (let index = 0; index < 5; index += 1) {
      const retry = http.expectOne(`/api/resource/${index}`);
      expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
      retry.flush({ ok: true });
    }
    expect(responses).toHaveLength(5);
  });
});

function authenticate(store: AuthStore): void {
  store.setAuthenticated({
    accessToken: 'access-token',
    tokenType: 'Bearer',
    expiresIn: 900,
    user: { id: 1, email: 'user@example.com', roles: ['ROLE_USER'] },
  });
}

class ControlledRefreshRepository {
  calls = 0;
  readonly response = new Subject<AuthenticatedSession>();
  refresh(): Observable<AuthenticatedSession> {
    this.calls += 1;
    return this.response;
  }
}
