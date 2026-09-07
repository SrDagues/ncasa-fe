import { Observable } from 'rxjs';
import { InboxNotification } from '../../domain/inbox-notification';
import { NotificationPage, NotificationQuery } from '../notification.models';

export interface NotificationInboxGateway {
  list(query: NotificationQuery): Observable<NotificationPage>;
  countUnread(): Observable<number>;
  markRead(notificationId: string): Observable<InboxNotification>;
  markAllRead(): Observable<void>;
}

export abstract class NotificationRefreshTrigger {
  abstract readonly focusChanges: Observable<void>;
}
