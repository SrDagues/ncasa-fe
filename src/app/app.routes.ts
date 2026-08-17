import { Routes } from '@angular/router';
import { AuthLayout } from './shared/layouts/auth-layout/auth-layout';
import { AppLayoutComponent } from './shared/layouts/app-layout/app-layout.component';

export const routes: Routes = [
  {
    path: 'app',
    component: AppLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (component) => component.DashboardComponent,
          ),
        title: 'Inicio · ncasa',
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./features/expenses/expense-list/expense-list.component').then(
            (component) => component.ExpenseListComponent,
          ),
        title: 'Gastos · ncasa',
      },
      {
        path: 'expenses/new',
        loadComponent: () =>
          import('./features/expenses/expense-form/expense-form.component').then(
            (component) => component.ExpenseFormComponent,
          ),
        title: 'Añadir gasto · ncasa',
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./features/expenses/expense-form/expense-form.component').then(
            (component) => component.ExpenseFormComponent,
          ),
        title: 'Escanear ticket · ncasa',
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/calendar.component').then(
            (component) => component.CalendarComponent,
          ),
        title: 'Calendario · ncasa',
      },
      {
        path: 'household',
        loadComponent: () =>
          import('./features/household/household.component').then(
            (component) => component.HouseholdComponent,
          ),
        title: 'Hogar · ncasa',
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
    title: 'Guía visual · ncasa',
  },
  {
    path: '',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login').then((component) => component.Login),
        title: 'Iniciar sesión · ncasa',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register').then((component) => component.Register),
        title: 'Crear mi hogar · ncasa',
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
