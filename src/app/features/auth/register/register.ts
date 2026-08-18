import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { EmailAlreadyRegisteredError, NetworkUnavailableError } from '../application/auth.errors';
import { RegisterUseCase } from '../application/use-cases/register.use-case';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  private readonly formBuilder = inject(FormBuilder);
  private readonly register = inject(RegisterUseCase);
  private readonly router = inject(Router);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    passwordConfirmation: ['', Validators.required],
    acceptTerms: [false, Validators.requiredTrue],
  }, { validators: passwordsMatch });
  protected readonly pending = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected showPassword = false;

  protected submit(): void {
    this.submitted.set(true);
    this.errorMessage.set(null);
    if (this.form.invalid || this.pending()) return;

    const { email, password } = this.form.getRawValue();
    this.pending.set(true);
    this.register.execute({ email, password }).pipe(
      finalize(() => this.pending.set(false)),
    ).subscribe({
      next: () => void this.router.navigateByUrl('/app/dashboard'),
      error: (error: unknown) => this.errorMessage.set(registrationErrorMessage(error)),
    });
  }
}

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmation = control.get('passwordConfirmation')?.value;
  return password === confirmation ? null : { passwordsMismatch: true };
}

function registrationErrorMessage(error: unknown): string {
  if (error instanceof EmailAlreadyRegisteredError) {
    return 'Ya existe una cuenta con este correo electrónico.';
  }
  if (error instanceof NetworkUnavailableError) {
    return 'No podemos conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.';
  }
  return 'No hemos podido crear tu cuenta. Inténtalo de nuevo.';
}
