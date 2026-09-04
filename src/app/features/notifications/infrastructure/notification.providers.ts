import { HttpClient } from '@angular/common/http';
import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { NotificationRefreshTrigger } from '../application/ports/notification-inbox.gateway';
import { CountUnreadNotificationsUseCase } from '../application/use-cases/count-unread-notifications.use-case';
import { ListNotificationsUseCase } from '../application/use-cases/list-notifications.use-case';
import { MarkAllNotificationsReadUseCase } from '../application/use-cases/mark-all-notifications-read.use-case';
import { MarkNotificationReadUseCase } from '../application/use-cases/mark-notification-read.use-case';
import { NotificationInboxStore } from '../presentation/notification-inbox.store';
import { NotificationTargetCoordinator } from '../presentation/notification-target.coordinator';
import { BrowserNotificationRefreshTrigger } from './browser/browser-notification-refresh-trigger';
import { HttpNotificationInboxGateway } from './http/http-notification-inbox.gateway';

export function provideNotifications(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: HttpNotificationInboxGateway, useFactory: () => new HttpNotificationInboxGateway(inject(HttpClient), environment.apiUrl) },
    { provide: NotificationRefreshTrigger, useClass: BrowserNotificationRefreshTrigger },
    { provide: ListNotificationsUseCase, useFactory: () => new ListNotificationsUseCase(inject(HttpNotificationInboxGateway)) },
    { provide: CountUnreadNotificationsUseCase, useFactory: () => new CountUnreadNotificationsUseCase(inject(HttpNotificationInboxGateway)) },
    { provide: MarkNotificationReadUseCase, useFactory: () => new MarkNotificationReadUseCase(inject(HttpNotificationInboxGateway)) },
    { provide: MarkAllNotificationsReadUseCase, useFactory: () => new MarkAllNotificationsReadUseCase(inject(HttpNotificationInboxGateway)) },
    NotificationInboxStore,
    NotificationTargetCoordinator,
  ]);
}
