import { Routes } from '@angular/router';
import { AuthLayout } from './shared/layouts/auth-layout/auth-layout';

export const routes: Routes = [
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
