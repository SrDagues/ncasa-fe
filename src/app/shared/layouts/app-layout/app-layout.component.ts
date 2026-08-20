import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../components/icon/icon.component';
import { LogoComponent } from '../../components/logo/logo.component';
import { IconButtonComponent } from '../../components/icon-button/icon-button.component';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { LogoutUseCase } from '../../../features/auth/application/use-cases/logout.use-case';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { AuthStore } from '../../../features/auth';
import { HouseholdStore } from '../../../features/household';

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
    TranslatePipe,
    LanguageSwitcherComponent,
  ],
  templateUrl: './app-layout.component.html',
})
export class AppLayoutComponent {
  private readonly logoutUser = inject(LogoutUseCase);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStore);
  protected readonly household = inject(HouseholdStore);
  protected readonly logoutPending = signal(false);
  protected readonly user = this.auth.currentUser;
  protected readonly userInitials = computed(() => this.user()?.email.slice(0, 2).toUpperCase() ?? '?');

  readonly nav = [
    { labelKey: 'navigation.dashboard', icon: 'home', path: '/app/dashboard' },
    { labelKey: 'navigation.expenses', icon: 'wallet', path: '/app/expenses' },
    { labelKey: 'navigation.tickets', icon: 'receipt-text', path: '/app/tickets' },
    { labelKey: 'navigation.calendar', icon: 'calendar', path: '/app/calendar' },
    { labelKey: 'navigation.household', icon: 'users', path: '/app/household' },
  ];

  constructor() {
    effect(() => {
      const user = this.user();
      if (user) void this.household.initialize(user.id);
      else this.household.reset();
    });
  }

  protected changeHousehold(event: Event): void {
    void this.household.select((event.target as HTMLSelectElement).value);
  }

  protected logout(): void {
    if (this.logoutPending()) return;
    this.logoutPending.set(true);
    this.logoutUser.execute().subscribe({
      complete: () => void this.router.navigateByUrl('/login'),
    });
  }
}
