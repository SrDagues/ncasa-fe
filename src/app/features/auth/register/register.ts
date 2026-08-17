import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  protected name = '';
  protected household = '';
  protected email = '';
  protected password = '';
  protected accept = false;
  protected showPassword = false;

  protected submit(): void {
    // La integración con el servicio de autenticación se añadirá con el backend.
  }
}
