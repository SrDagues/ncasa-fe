import { Observable } from 'rxjs';
import { NotificationInboxGateway } from '../ports/notification-inbox.gateway';

export class MarkAllNotificationsReadUseCase {
  constructor(private readonly gateway: Pick<NotificationInboxGateway, 'markAllRead'>) {}
  execute(): Observable<void> { return this.gateway.markAllRead(); }
}
