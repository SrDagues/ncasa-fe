import { describe, expect, it } from 'vitest';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  it('should start with an unknown session', () => {
    const store = new AuthStore();

    expect(store.status()).toBe('unknown');
    expect(store.currentUser()).toBeNull();
    expect(store.accessToken()).toBeNull();
  });

  it('should keep an authenticated session in memory', () => {
    const store = new AuthStore();

    store.setAuthenticated({
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: { id: 1, email: 'user@example.com', roles: ['ROLE_USER'] },
    });

    expect(store.status()).toBe('authenticated');
    expect(store.accessToken()).toBe('access-token');
    expect(store.currentUser()?.email).toBe('user@example.com');
  });

  it('should clear all session data when becoming anonymous', () => {
    const store = new AuthStore();
    store.setAuthenticated({
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: { id: 1, email: 'user@example.com', roles: ['ROLE_USER'] },
    });

    store.setAnonymous();

    expect(store.status()).toBe('anonymous');
    expect(store.currentUser()).toBeNull();
    expect(store.accessToken()).toBeNull();
  });
});
