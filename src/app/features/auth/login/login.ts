import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { InvalidCredentialsError, NetworkUnavailableError } from '../application/auth.errors';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  private readonly login = inject(LoginUseCase);
  private readonly router = inject(Router);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  protected readonly pending = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected showPassword = false;

  protected submit(): void {
    this.submitted.set(true);
    this.errorMessage.set(null);
    if (this.form.invalid || this.pending()) return;

    this.pending.set(true);
    this.login.execute(this.form.getRawValue()).pipe(
      finalize(() => this.pending.set(false)),
    ).subscribe({
      next: () => void this.router.navigateByUrl('/app/dashboard'),
      error: (error: unknown) => this.errorMessage.set(loginErrorMessage(error)),
    });
  }
}

function loginErrorMessage(error: unknown): string {
  if (error instanceof InvalidCredentialsError) {
    return 'El correo o la contraseña no son correctos.';
  }
  if (error instanceof NetworkUnavailableError) {
    return 'No podemos conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.';
  }
  return 'No hemos podido iniciar sesión. Inténtalo de nuevo.';
}
