import { Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import {
  EmailVerificationRequiredError,
  InvalidCredentialsError,
  NetworkUnavailableError,
} from '../application/auth.errors';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './login.html',
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  private readonly login = inject(LoginUseCase);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  protected readonly pending = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly emailVerified = isTrueNavigationState(
    this.location.getState(),
    'emailVerified',
  );
  protected showPassword = false;

  protected submit(): void {
    this.submitted.set(true);
    this.errorMessage.set(null);
    if (this.form.invalid || this.pending()) return;

    this.pending.set(true);
    this.login.execute(this.form.getRawValue()).pipe(
      finalize(() => this.pending.set(false)),
    ).subscribe({
      next: () => void this.router.navigateByUrl(this.safeReturnUrl()),
      error: (error: unknown) => {
        if (error instanceof EmailVerificationRequiredError) {
          void this.router.navigate(['/check-email'], {
            replaceUrl: true,
            state: { email: this.form.controls.email.value },
          });
          return;
        }
        this.errorMessage.set(loginErrorKey(error));
      },
    });
  }

  private safeReturnUrl(): string {
    const requested = this.route.snapshot.queryParamMap.get('returnUrl');
    return requested?.startsWith('/app/') ? requested : '/app/dashboard';
  }
}

function isTrueNavigationState(state: unknown, key: string): boolean {
  return typeof state === 'object' && state !== null
    && key in state && (state as Record<string, unknown>)[key] === true;
}

function loginErrorKey(error: unknown): string {
  if (error instanceof InvalidCredentialsError) {
    return 'auth.errors.invalidCredentials';
  }
  if (error instanceof NetworkUnavailableError) {
    return 'auth.errors.network';
  }
  return 'auth.errors.loginUnknown';
}
