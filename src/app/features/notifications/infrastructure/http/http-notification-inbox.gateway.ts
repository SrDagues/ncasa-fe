import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { NotificationInboxGateway } from '../../application/ports/notification-inbox.gateway';
import { NotificationPage, NotificationQuery } from '../../application/notification.models';
import { InboxNotification } from '../../domain/inbox-notification';
import { mapInboxNotification, mapNotificationPage, mapUnreadCount } from './notification-api.mapper';
import { normalizeNotificationHttpErrors } from './notification-http-errors';

export class HttpNotificationInboxGateway implements NotificationInboxGateway {
  private readonly baseUrl: string;
  constructor(private readonly http: HttpClient, apiUrl: string) { this.baseUrl = `${apiUrl}/notifications`; }

  list(query: NotificationQuery): Observable<NotificationPage> {
    const params = new HttpParams().set('unreadOnly', query.unreadOnly).set('page', query.page).set('size', query.size);
    return this.http.get<unknown>(this.baseUrl, { params }).pipe(map(mapNotificationPage), normalizeNotificationHttpErrors());
  }
  countUnread(): Observable<number> {
    return this.http.get<unknown>(`${this.baseUrl}/unread-count`).pipe(map(mapUnreadCount), normalizeNotificationHttpErrors());
  }
  markRead(notificationId: string): Observable<InboxNotification> {
    return this.http.post<unknown>(`${this.baseUrl}/${encodeURIComponent(notificationId)}/read`, null)
      .pipe(map(mapInboxNotification), normalizeNotificationHttpErrors());
  }
  markAllRead(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/read-all`, null).pipe(normalizeNotificationHttpErrors());
  }
}
