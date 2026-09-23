import { Routes } from '@angular/router';
import { AuthLayout } from './shared/layouts/auth-layout/auth-layout';
import { AppLayoutComponent } from './shared/layouts/app-layout/app-layout.component';
import { authGuard, guestGuard } from './features/auth/presentation/auth.guards';
import { provideExpenses } from './features/expenses';
import { provideNotifications } from './features/notifications';
import { provideCalendar } from './features/calendar';
import { provideShoppingLists } from './features/shopping-lists';

export const routes: Routes = [
  {
    path: 'app',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    providers: [provideExpenses(), provideNotifications(), provideCalendar(), provideShoppingLists()],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (component) => component.DashboardComponent,
          ),
        data: { titleKey: 'metadata.dashboard' },
      },
      {
        path: 'expenses',
        loadChildren: () => import('./features/expenses/expenses.routes').then(module => module.EXPENSE_ROUTES),
        data: { titleKey: 'metadata.expenses' },
      },
      { path: 'tickets', redirectTo: 'expenses', pathMatch: 'full' },
      {
        path: 'calendar',
        loadChildren: () => import('./features/calendar/calendar.routes').then(module => module.CALENDAR_ROUTES),
        data: { titleKey: 'metadata.calendar' },
      },
      {
        path: 'shopping-lists',
        loadChildren: () => import('./features/shopping-lists/shopping-lists.routes').then(module => module.SHOPPING_LIST_ROUTES),
        data: { titleKey: 'metadata.shoppingLists' },
      },
      {
        path: 'notifications',
        loadChildren: () => import('./features/notifications/notification.routes').then(module => module.NOTIFICATION_ROUTES),
        data: { titleKey: 'metadata.notifications' },
      },
      {
        path: 'household',
        loadComponent: () =>
          import('./features/household/household.component').then(
            (component) => component.HouseholdComponent,
          ),
        data: { titleKey: 'metadata.household' },
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  {
    path: 'style-guide',
    loadComponent: () =>
      import('./features/style-guide/style-guide.component').then(
        (component) => component.StyleGuideComponent,
      ),
    data: { titleKey: 'metadata.styleGuide' },
  },
  {
    path: '',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/login/login').then((component) => component.Login),
        data: { titleKey: 'metadata.login' },
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/register/register').then((component) => component.Register),
        data: { titleKey: 'metadata.register' },
      },
      {
        path: 'check-email',
        loadComponent: () =>
          import('./features/auth/check-email/check-email').then(
            (component) => component.CheckEmail,
          ),
        data: { titleKey: 'metadata.checkEmail' },
      },
      {
        path: 'verify-email',
        loadComponent: () =>
          import('./features/auth/verify-email/verify-email').then(
            (component) => component.VerifyEmail,
          ),
        data: { titleKey: 'metadata.verifyEmail' },
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
