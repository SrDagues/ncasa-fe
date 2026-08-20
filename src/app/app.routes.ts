import { Routes } from '@angular/router';
import { AuthLayout } from './shared/layouts/auth-layout/auth-layout';
import { AppLayoutComponent } from './shared/layouts/app-layout/app-layout.component';
import { authGuard, guestGuard } from './features/auth/presentation/auth.guards';
import { provideExpenses } from './features/expenses';

export const routes: Routes = [
  {
    path: 'app',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    providers: [provideExpenses()],
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
        loadComponent: () =>
          import('./features/calendar/calendar.component').then(
            (component) => component.CalendarComponent,
          ),
        data: { titleKey: 'metadata.calendar' },
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
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login').then((component) => component.Login),
        data: { titleKey: 'metadata.login' },
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register').then((component) => component.Register),
        data: { titleKey: 'metadata.register' },
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
