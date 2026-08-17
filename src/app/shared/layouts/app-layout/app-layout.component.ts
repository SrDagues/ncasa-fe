import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../components/icon/icon.component';
import { LogoComponent } from '../../components/logo/logo.component';
import { IconButtonComponent } from '../../components/icon-button/icon-button.component';
import { AvatarComponent } from '../../components/avatar/avatar.component';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    IconComponent,
    LogoComponent,
    IconButtonComponent,
    AvatarComponent,
  ],
  templateUrl: './app-layout.component.html',
})
export class AppLayoutComponent {
  readonly nav = [
    { label: 'Inicio', icon: 'home', path: '/app/dashboard' },
    { label: 'Gastos', icon: 'wallet', path: '/app/expenses' },
    { label: 'Tickets', icon: 'receipt-text', path: '/app/tickets' },
    { label: 'Calendario', icon: 'calendar', path: '/app/calendar' },
    { label: 'Hogar', icon: 'users', path: '/app/household' },
  ];
}
