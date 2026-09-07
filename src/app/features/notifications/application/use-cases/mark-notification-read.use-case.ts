import { Observable, throwError } from 'rxjs';
import { InboxNotification } from '../../domain/inbox-notification';
import { NotificationApplicationError } from '../notification.errors';
import { NotificationInboxGateway } from '../ports/notification-inbox.gateway';

export class MarkNotificationReadUseCase {
  constructor(private readonly gateway: Pick<NotificationInboxGateway, 'markRead'>) {}
  execute(notificationId: string): Observable<InboxNotification> {
    if (!notificationId.trim()) return throwError(() => new NotificationApplicationError('validation', 'Notification id is required'));
    return this.gateway.markRead(notificationId);
  }
}
