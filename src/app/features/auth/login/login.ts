import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  protected email = '';
  protected password = '';
  protected remember = true;
  protected showPassword = false;

  protected submit(): void {
    // La integración con el servicio de autenticación se añadirá con el backend.
  }
}
