import { Observable, throwError } from 'rxjs';
import { NotificationApplicationError } from '../notification.errors';
import { NotificationPage, NotificationQuery } from '../notification.models';
import { NotificationInboxGateway } from '../ports/notification-inbox.gateway';

export class ListNotificationsUseCase {
  constructor(private readonly gateway: Pick<NotificationInboxGateway, 'list'>) {}
  execute(query: NotificationQuery): Observable<NotificationPage> {
    if (!Number.isInteger(query.page) || query.page < 0 || !Number.isInteger(query.size) || query.size < 1 || query.size > 50) {
      return throwError(() => new NotificationApplicationError('validation', 'Invalid notification pagination'));
    }
    return this.gateway.list(query);
  }
}
