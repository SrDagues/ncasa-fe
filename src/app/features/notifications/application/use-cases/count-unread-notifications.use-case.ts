import { Observable } from 'rxjs';
import { NotificationInboxGateway } from '../ports/notification-inbox.gateway';

export class CountUnreadNotificationsUseCase {
  constructor(private readonly gateway: Pick<NotificationInboxGateway, 'countUnread'>) {}
  execute(): Observable<number> { return this.gateway.countUnread(); }
}
