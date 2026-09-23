import { Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import {
  NetworkUnavailableError,
  VerificationRateLimitedError,
} from '../application/auth.errors';
import { ResendEmailVerificationUseCase } from '../application/use-cases/resend-email-verification.use-case';

@Component({
  selector: 'app-check-email',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './check-email.html',
})
export class CheckEmail {
  private readonly formBuilder = inject(FormBuilder);
  private readonly resend = inject(ResendEmailVerificationUseCase);
  private readonly location = inject(Location);
  private readonly initialEmail = emailFromNavigationState(this.location.getState());

  protected readonly form = this.formBuilder.nonNullable.group({
    email: [this.initialEmail ?? '', [Validators.required, Validators.email]],
  });
  protected readonly pending = signal(false);
  protected readonly submitted = signal(false);
  protected readonly sent = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly retryAfterSeconds = signal<number | null>(null);
  protected readonly registeredEmail = this.initialEmail;

  constructor() {
    this.form.controls.email.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.sent.set(false);
      this.errorMessage.set(null);
      this.retryAfterSeconds.set(null);
    });
  }

  protected submit(): void {
    this.submitted.set(true);
    this.errorMessage.set(null);
    this.retryAfterSeconds.set(null);
    if (this.form.invalid || this.pending()) return;

    this.sent.set(false);
    this.pending.set(true);
    this.resend.execute(this.form.controls.email.value).pipe(
      finalize(() => this.pending.set(false)),
    ).subscribe({
      next: () => this.sent.set(true),
      error: (error: unknown) => {
        if (error instanceof VerificationRateLimitedError) {
          this.retryAfterSeconds.set(error.retryAfterSeconds);
          this.errorMessage.set('auth.verification.resendRateLimited');
          return;
        }
        this.errorMessage.set(error instanceof NetworkUnavailableError
          ? 'auth.errors.network'
          : 'auth.verification.resendError');
      },
    });
  }
}

function emailFromNavigationState(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('email' in state)) return null;
  const email = (state as Record<string, unknown>)['email'];
  return typeof email === 'string' ? email : null;
}
