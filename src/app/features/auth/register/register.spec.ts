import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EmailAlreadyRegisteredError,
  NetworkUnavailableError,
} from '../application/auth.errors';
import { RegisterUseCase } from '../application/use-cases/register.use-case';
import { AuthenticatedSession } from '../domain/auth.models';
import { Register } from './register';

describe('Register page', () => {
  const session: AuthenticatedSession = {
    accessToken: 'access-token',
    tokenType: 'Bearer',
    expiresIn: 900,
    user: { id: 1, email: 'user@example.com', roles: ['ROLE_USER'] },
  };
  let execute: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    execute = vi.fn(() => of(session));
    TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideRouter([]),
        { provide: RegisterUseCase, useValue: { execute } },
      ],
    });
  });

  it('should not submit an invalid registration', () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();

    submit(fixture.nativeElement);

    expect(execute).not.toHaveBeenCalled();
  });

  it('should expose accessible validation errors including password mismatch', () => {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    fill(fixture.nativeElement, '#register-password', 'password123');
    fill(fixture.nativeElement, '#register-password-confirmation', 'different123');

    submit(fixture.nativeElement);
    fixture.detectChanges();

    const email = fixture.nativeElement.querySelector('#register-email');
    const confirmation = fixture.nativeElement.querySelector('#register-password-confirmation');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe('register-email-error');
    expect(confirmation.getAttribute('aria-invalid')).toBe('true');
    expect(confirmation.getAttribute('aria-describedby')).toBe('register-password-confirmation-error');
    expect(fixture.nativeElement.querySelector('#register-password-confirmation-error')?.textContent)
      .toContain('coinciden');
  });

  it('should register only identity data and navigate to the dashboard', () => {
    const fixture = TestBed.createComponent(Register);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
    completeForm(fixture.nativeElement);

    submit(fixture.nativeElement);

    expect(execute).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(navigate).toHaveBeenCalledWith('/app/dashboard');
  });

  it('should explain when the email is already registered', () => {
    execute.mockReturnValue(throwError(() => new EmailAlreadyRegisteredError()));
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    completeForm(fixture.nativeElement);

    submit(fixture.nativeElement);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent)
      .toContain('Ya existe una cuenta');
  });

  it('should explain network failures', () => {
    execute.mockReturnValue(throwError(() => new NetworkUnavailableError()));
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    completeForm(fixture.nativeElement);

    submit(fixture.nativeElement);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent)
      .toContain('conectar con el servidor');
  });

  it('should prevent duplicate submissions while registration is pending', () => {
    execute.mockReturnValue(new Subject<AuthenticatedSession>());
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    completeForm(fixture.nativeElement);

    submit(fixture.nativeElement);
    submit(fixture.nativeElement);

    expect(execute).toHaveBeenCalledTimes(1);
  });
});

function completeForm(root: HTMLElement): void {
  fill(root, '#register-email', 'user@example.com');
  fill(root, '#register-password', 'password123');
  fill(root, '#register-password-confirmation', 'password123');
  const terms = root.querySelector<HTMLInputElement>('#register-terms');
  if (!terms) throw new Error('Missing terms checkbox');
  terms.click();
}

function fill(root: HTMLElement, selector: string, value: string): void {
  const input = root.querySelector<HTMLInputElement>(selector);
  if (!input) throw new Error(`Missing input ${selector}`);
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function submit(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('form');
  if (!form) throw new Error('Missing registration form');
  form.dispatchEvent(new Event('submit'));
}
