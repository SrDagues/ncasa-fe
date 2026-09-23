import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { PrepareVerificationLoginUseCase } from './prepare-verification-login.use-case';

describe('Prepare verification login', () => {
  it('should clear the previous identity only after the refresh session is revoked', () => {
    const response = new Subject<void>();
    const state = { setAnonymous: vi.fn(), setAuthenticated: vi.fn() };
    const ready = vi.fn();
    new PrepareVerificationLoginUseCase({ logout: () => response }, state).execute().subscribe(ready);
    expect(state.setAnonymous).not.toHaveBeenCalled();
    expect(ready).not.toHaveBeenCalled();
    response.next(undefined);
    expect(state.setAnonymous).toHaveBeenCalledOnce();
    expect(state.setAnonymous.mock.invocationCallOrder[0]).toBeLessThan(ready.mock.invocationCallOrder[0]);
  });

  it('should propagate a failed revocation instead of reporting that login is ready', () => {
    const response = new Subject<void>();
    const state = { setAnonymous: vi.fn(), setAuthenticated: vi.fn() };
    const ready = vi.fn();
    const failure = vi.fn();
    new PrepareVerificationLoginUseCase({ logout: () => response }, state).execute()
      .subscribe({ next: ready, error: failure });
    response.error(new Error('offline'));
    expect(ready).not.toHaveBeenCalled();
    expect(failure).toHaveBeenCalledOnce();
  });
});
