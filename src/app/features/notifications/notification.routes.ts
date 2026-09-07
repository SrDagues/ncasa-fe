import { Routes } from '@angular/router';

export const NOTIFICATION_ROUTES: Routes = [{
  path: '',
  loadComponent: () => import('./presentation/notification-inbox.component').then(component => component.NotificationInboxComponent),
  data: { titleKey: 'metadata.notifications' },
}];
