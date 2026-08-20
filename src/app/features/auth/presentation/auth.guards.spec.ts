import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { describe, beforeEach, expect, it } from 'vitest';
import { firstValueFrom, Observable } from 'rxjs';
import { AuthStore } from './auth.store';
import { authGuard, guestGuard } from './auth.guards';

describe('authentication guards', () => {
  let store: AuthStore;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AuthStore, provideRouter([])] });
    store = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
  });

  it('should allow authenticated users into private routes', () => {
    authenticate(store);

    const result = TestBed.runInInjectionContext(() => authGuard());

    expect(result).toBe(true);
  });

  it('should redirect anonymous users to login', () => {
    store.setAnonymous();

    const result = TestBed.runInInjectionContext(() => authGuard());

    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('should redirect authenticated users away from guest routes', () => {
    authenticate(store);

    const result = TestBed.runInInjectionContext(() => guestGuard());

    expect((result as UrlTree).toString()).toBe('/app/dashboard');
  });

  it('should allow anonymous users into guest routes', () => {
    store.setAnonymous();

    expect(TestBed.runInInjectionContext(() => guestGuard())).toBe(true);
  });

  it('should wait for session restoration before deciding', async () => {
    const pending = TestBed.runInInjectionContext(() => authGuard());

    store.setAnonymous();

    const result = await firstValueFrom(pending as Observable<boolean | UrlTree>);
    expect((result as UrlTree).toString()).toBe('/login');
  });
});

function authenticate(store: AuthStore): void {
  store.setAuthenticated({
    accessToken: 'token', tokenType: 'Bearer', expiresIn: 900,
    user: { id: 1, email: 'user@example.com', roles: ['ROLE_USER'] },
  });
}
