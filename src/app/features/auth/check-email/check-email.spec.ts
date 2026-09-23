import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import es from '../../../../../public/i18n/es.json';
import {
  NetworkUnavailableError,
  VerificationRateLimitedError,
} from '../application/auth.errors';
import { ResendEmailVerificationUseCase } from '../application/use-cases/resend-email-verification.use-case';
import { CheckEmail } from './check-email';

describe('Check email page', () => {
  let execute: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    execute = vi.fn(() => of(undefined));
    TestBed.configureTestingModule({
      imports: [CheckEmail],
      providers: [
        provideRouter([]),
        provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
        { provide: ResendEmailVerificationUseCase, useValue: { execute } },
      ],
    });
    TestBed.inject(TranslateService).setTranslation('es', es);
  });

  it('should explain the next steps and prefill the transient navigation email', () => {
    TestBed.inject(Location).replaceState('/check-email', '', { email: 'user@example.com' });

    const fixture = TestBed.createComponent(CheckEmail);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Revisa tu correo');
    expect(fixture.nativeElement.textContent).toContain('user@example.com');
    expect((fixture.nativeElement as HTMLElement)
      .querySelector<HTMLInputElement>('#verification-email')?.value)
      .toBe('user@example.com');
  });

  it('should request one resend and announce a neutral result', () => {
    const fixture = TestBed.createComponent(CheckEmail);
    fixture.detectChanges();
    fill(fixture.nativeElement, 'user@example.com');

    submit(fixture.nativeElement);
    fixture.detectChanges();

    expect(execute).toHaveBeenCalledWith('user@example.com');
    expect(execute).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent)
      .toContain('Si existe una cuenta pendiente');
    expect((fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled)
      .toBe(false);
  });

  it('should preserve the email and explain recoverable failures', () => {
    execute.mockReturnValueOnce(throwError(() => new NetworkUnavailableError()));
    const fixture = TestBed.createComponent(CheckEmail);
    fixture.detectChanges();
    fill(fixture.nativeElement, 'user@example.com');

    submit(fixture.nativeElement);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent)
      .toContain('conectar con el servidor');
    expect((fixture.nativeElement as HTMLElement)
      .querySelector<HTMLInputElement>('#verification-email')?.value)
      .toBe('user@example.com');

    execute.mockReturnValueOnce(throwError(() => new VerificationRateLimitedError(37)));
    submit(fixture.nativeElement);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('37');
  });

  it('should guard duplicate submissions while a resend is pending', () => {
    execute.mockReturnValue(new Subject<void>());
    const fixture = TestBed.createComponent(CheckEmail);
    fixture.detectChanges();
    fill(fixture.nativeElement, 'user@example.com');

    submit(fixture.nativeElement);
    submit(fixture.nativeElement);

    expect(execute).toHaveBeenCalledTimes(1);
  });
});

function fill(root: HTMLElement, value: string): void {
  const input = root.querySelector<HTMLInputElement>('#verification-email');
  if (!input) throw new Error('Missing verification email input');
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function submit(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('form');
  if (!form) throw new Error('Missing resend form');
  form.dispatchEvent(new Event('submit'));
}
