import { Observable, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { AuthRepository } from '../ports/auth.repository';
import { ConfirmEmailUseCase } from './confirm-email.use-case';
import { ResendEmailVerificationUseCase } from './resend-email-verification.use-case';

describe('email verification use cases', () => {
  it('should confirm an email with the received token', () => {
    const repository = new FakeRepository();

    new ConfirmEmailUseCase(repository).execute('raw-token').subscribe();

    expect(repository.confirmedToken).toBe('raw-token');
  });

  it('should request a neutral resend for the received email', () => {
    const repository = new FakeRepository();

    new ResendEmailVerificationUseCase(repository).execute('user@example.com').subscribe();

    expect(repository.resentEmail).toBe('user@example.com');
  });
});

class FakeRepository implements Pick<AuthRepository, 'confirmEmail' | 'resendEmailVerification'> {
  confirmedToken: string | null = null;
  resentEmail: string | null = null;

  confirmEmail(token: string): Observable<void> {
    this.confirmedToken = token;
    return of(undefined);
  }

  resendEmailVerification(email: string): Observable<void> {
    this.resentEmail = email;
    return of(undefined);
  }
}
