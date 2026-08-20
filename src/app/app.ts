import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogHostComponent } from './shared/components/confirm-dialog/confirm-dialog-host.component';
import { NotificationHostComponent } from './shared/components/notification/notification-host.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmDialogHostComponent, NotificationHostComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
}
