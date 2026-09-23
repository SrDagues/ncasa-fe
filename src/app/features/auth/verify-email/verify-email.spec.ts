import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import es from '../../../../../public/i18n/es.json';
import {
  EmailAlreadyVerifiedError,
  ExpiredEmailVerificationTokenError,
  InvalidEmailVerificationTokenError,
  NetworkUnavailableError,
} from '../application/auth.errors';
import { ConfirmEmailUseCase } from '../application/use-cases/confirm-email.use-case';
import { VerifyEmail } from './verify-email';
import { PrepareVerificationLoginUseCase } from '../application/use-cases/prepare-verification-login.use-case';

describe('Verify email page', () => {
  let execute: ReturnType<typeof vi.fn>;
  let fragment: string | null;
  let prepareLogin: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fragment = 'token=raw-token';
    execute = vi.fn(() => of(undefined));
    prepareLogin = vi.fn(() => of(undefined));
    TestBed.configureTestingModule({
      imports: [VerifyEmail],
      providers: [
        provideRouter([]),
        provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
        { provide: ConfirmEmailUseCase, useValue: { execute } },
        { provide: PrepareVerificationLoginUseCase, useValue: { execute: prepareLogin } },
        { provide: ActivatedRoute, useFactory: () => ({ snapshot: { fragment } }) },
      ],
    });
    TestBed.inject(TranslateService).setTranslation('es', es);
  });

  it('should remove the fragment before confirming and then navigate to login', () => {
    const location = TestBed.inject(Location);
    const replaceState = vi.spyOn(location, 'replaceState');
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');

    TestBed.createComponent(VerifyEmail).detectChanges();

    expect(replaceState).toHaveBeenCalledWith('/verify-email');
    expect(execute).toHaveBeenCalledWith('raw-token');
    expect(prepareLogin).toHaveBeenCalledTimes(1);
    expect(prepareLogin.mock.invocationCallOrder[0]).toBeLessThan(navigate.mock.invocationCallOrder[0]);
    expect(replaceState.mock.invocationCallOrder[0]).toBeLessThan(execute.mock.invocationCallOrder[0]);
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      replaceUrl: true,
      state: { emailVerified: true },
    });
  });

  it('should treat an already verified account as a successful outcome', () => {
    execute.mockReturnValue(throwError(() => new EmailAlreadyVerifiedError()));
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');

    TestBed.createComponent(VerifyEmail).detectChanges();

    expect(navigate).toHaveBeenCalledWith(['/login'], {
      replaceUrl: true,
      state: { emailVerified: true },
    });
  });

  it.each([
    [new ExpiredEmailVerificationTokenError(), 'ha caducado'],
    [new InvalidEmailVerificationTokenError(), 'no es válido'],
    [new NetworkUnavailableError(), 'conectar con el servidor'],
  ] as const)('should show a recoverable verification failure', (failure, expectedText) => {
    execute.mockReturnValue(throwError(() => failure));
    const fixture = TestBed.createComponent(VerifyEmail);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent)
      .toContain(expectedText);
    expect(fixture.nativeElement.querySelector('a[href="/check-email"]')).not.toBeNull();
  });

  it('should not call the backend when the route has no token', () => {
    fragment = null;
    const fixture = TestBed.createComponent(VerifyEmail);

    fixture.detectChanges();

    expect(execute).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent)
      .toContain('no es válido');
  });

  it('should stay on the page if session cleanup fails and retry cleanup without consuming the token again', () => {
    prepareLogin.mockReturnValueOnce(throwError(() => new Error('offline')));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    const fixture = TestBed.createComponent(VerifyEmail);
    fixture.detectChanges();
    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('sesión anterior');
    fixture.nativeElement.querySelector('button').click();
    expect(execute).toHaveBeenCalledTimes(1);
    expect(prepareLogin).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true, state: { emailVerified: true } });
  });
});
