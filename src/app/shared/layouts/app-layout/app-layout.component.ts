import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../components/icon/icon.component';
import { LogoComponent } from '../../components/logo/logo.component';
import { IconButtonComponent } from '../../components/icon-button/icon-button.component';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { LogoutUseCase } from '../../../features/auth/application/use-cases/logout.use-case';

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
  private readonly logoutUser = inject(LogoutUseCase);
  private readonly router = inject(Router);
  protected readonly logoutPending = signal(false);

  readonly nav = [
    { label: 'Inicio', icon: 'home', path: '/app/dashboard' },
    { label: 'Gastos', icon: 'wallet', path: '/app/expenses' },
    { label: 'Tickets', icon: 'receipt-text', path: '/app/tickets' },
    { label: 'Calendario', icon: 'calendar', path: '/app/calendar' },
    { label: 'Hogar', icon: 'users', path: '/app/household' },
  ];

  protected logout(): void {
    if (this.logoutPending()) return;
    this.logoutPending.set(true);
    this.logoutUser.execute().subscribe({
      complete: () => void this.router.navigateByUrl('/login'),
    });
  }
}
