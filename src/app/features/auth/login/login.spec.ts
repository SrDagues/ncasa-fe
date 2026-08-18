import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { AuthenticatedSession } from '../domain/auth.models';
import { Login } from './login';
import { InvalidCredentialsError } from '../application/auth.errors';

describe('Login page', () => {
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
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: LoginUseCase, useValue: { execute } },
      ],
    });
  });

  it('should not submit invalid credentials', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();

    submit(fixture.nativeElement);

    expect(execute).not.toHaveBeenCalled();
  });

  it('should associate validation errors with their fields', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();

    submit(fixture.nativeElement);
    fixture.detectChanges();

    const email = fixture.nativeElement.querySelector('#login-email');
    const password = fixture.nativeElement.querySelector('#login-password');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe('login-email-error');
    expect(password.getAttribute('aria-describedby')).toBe('login-password-error');
    expect(fixture.nativeElement.querySelector('#login-email-error')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#login-password-error')).not.toBeNull();
  });

  it('should authenticate and navigate to the dashboard', () => {
    const fixture = TestBed.createComponent(Login);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
    fill(fixture.nativeElement, '#login-email', 'user@example.com');
    fill(fixture.nativeElement, '#login-password', 'password123');

    submit(fixture.nativeElement);

    expect(execute).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(navigate).toHaveBeenCalledWith('/app/dashboard');
  });

  it('should show an accessible error when authentication fails', () => {
    execute.mockReturnValue(throwError(() => new InvalidCredentialsError()));
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fill(fixture.nativeElement, '#login-email', 'user@example.com');
    fill(fixture.nativeElement, '#login-password', 'wrong-password');

    submit(fixture.nativeElement);
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('correo o la contraseña');
    expect(alert?.classList).toContain('form-message--error');
  });

  it('should prevent duplicate submissions while login is pending', () => {
    execute.mockReturnValue(new Subject<AuthenticatedSession>());
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fill(fixture.nativeElement, '#login-email', 'user@example.com');
    fill(fixture.nativeElement, '#login-password', 'password123');

    submit(fixture.nativeElement);
    submit(fixture.nativeElement);

    expect(execute).toHaveBeenCalledTimes(1);
  });
});

function fill(root: HTMLElement, selector: string, value: string): void {
  const input = root.querySelector<HTMLInputElement>(selector);
  if (!input) throw new Error(`Missing input ${selector}`);
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function submit(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('form');
  if (!form) throw new Error('Missing login form');
  form.dispatchEvent(new Event('submit'));
}
