import { Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import {
  EmailAlreadyVerifiedError,
  ExpiredEmailVerificationTokenError,
  InvalidEmailVerificationTokenError,
  NetworkUnavailableError,
  VerificationRateLimitedError,
} from '../application/auth.errors';
import { ConfirmEmailUseCase } from '../application/use-cases/confirm-email.use-case';
import { PrepareVerificationLoginUseCase } from '../application/use-cases/prepare-verification-login.use-case';

type VerificationViewState =
  | 'verifying'
  | 'session-error'
  | 'invalid'
  | 'expired'
  | 'rate-limited'
  | 'network-error'
  | 'unexpected-error';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './verify-email.html',
})
export class VerifyEmail implements OnInit {
  private readonly confirm = inject(ConfirmEmailUseCase);
  private readonly prepareLogin = inject(PrepareVerificationLoginUseCase);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private token: string | null = null;

  protected readonly state = signal<VerificationViewState>('verifying');
  protected readonly retryAfterSeconds = signal<number | null>(null);

  ngOnInit(): void {
    this.token = tokenFromFragment(this.route.snapshot.fragment);
    this.location.replaceState('/verify-email');
    if (!this.token) {
      this.state.set('invalid');
      return;
    }
    this.verify();
  }

  protected retry(): void {
    if (this.state() === 'session-error') {
      this.navigateToSuccessfulLogin();
      return;
    }
    if (this.token && this.state() !== 'verifying') this.verify();
  }

  protected errorKey(): string {
    switch (this.state()) {
      case 'session-error': return 'auth.verification.sessionError';
      case 'expired': return 'auth.verification.expired';
      case 'rate-limited': return 'auth.verification.confirmRateLimited';
      case 'network-error': return 'auth.errors.network';
      case 'unexpected-error': return 'auth.verification.confirmError';
      default: return 'auth.verification.invalid';
    }
  }

  protected canRetry(): boolean {
    return this.state() === 'rate-limited'
      || this.state() === 'session-error'
      || this.state() === 'network-error'
      || this.state() === 'unexpected-error';
  }

  private verify(): void {
    if (!this.token) return;
    this.state.set('verifying');
    this.retryAfterSeconds.set(null);
    this.confirm.execute(this.token).subscribe({
      next: () => this.navigateToSuccessfulLogin(),
      error: (error: unknown) => {
        if (error instanceof EmailAlreadyVerifiedError) {
          this.navigateToSuccessfulLogin();
        } else if (error instanceof ExpiredEmailVerificationTokenError) {
          this.state.set('expired');
        } else if (error instanceof InvalidEmailVerificationTokenError) {
          this.state.set('invalid');
        } else if (error instanceof VerificationRateLimitedError) {
          this.retryAfterSeconds.set(error.retryAfterSeconds);
          this.state.set('rate-limited');
        } else if (error instanceof NetworkUnavailableError) {
          this.state.set('network-error');
        } else {
          this.state.set('unexpected-error');
        }
      },
    });
  }

  private navigateToSuccessfulLogin(): void {
    this.token = null;
    this.state.set('verifying');
    this.prepareLogin.execute().subscribe({
      next: () => void this.router.navigate(['/login'], {
        replaceUrl: true,
        state: { emailVerified: true },
      }),
      error: () => this.state.set('session-error'),
    });
  }
}

function tokenFromFragment(fragment: string | null): string | null {
  const token = new URLSearchParams(fragment ?? '').get('token');
  return token?.trim() || null;
}
