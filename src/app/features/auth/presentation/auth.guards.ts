import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, filter, map, take } from 'rxjs';
import { AuthenticationStatus } from '../domain/auth.models';
import { AuthStore } from './auth.store';

type GuardResult = boolean | UrlTree | Observable<boolean | UrlTree>;

export function authGuard(_route?: ActivatedRouteSnapshot, state?: RouterStateSnapshot): GuardResult {
  return decide('authenticated', state ? `/login?returnUrl=${encodeURIComponent(state.url)}` : '/login');
}

export function guestGuard(): GuardResult {
  return decide('anonymous', '/app/dashboard');
}

function decide(allowed: AuthenticationStatus, redirectTo: string): GuardResult {
  const store = inject(AuthStore);
  const router = inject(Router);
  const current = store.status();
  if (current !== 'unknown') {
    return current === allowed || router.parseUrl(redirectTo);
  }
  return toObservable(store.status).pipe(
    filter((status) => status !== 'unknown'),
    take(1),
    map((status) => status === allowed || router.parseUrl(redirectTo)),
  );
}
