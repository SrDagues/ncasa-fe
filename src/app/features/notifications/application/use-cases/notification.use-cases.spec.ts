import { Observable, firstValueFrom, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { InboxNotification } from '../../domain/inbox-notification';
import { NotificationPage, NotificationQuery } from '../notification.models';
import { NotificationInboxGateway } from '../ports/notification-inbox.gateway';
import { ListNotificationsUseCase } from './list-notifications.use-case';
import { MarkNotificationReadUseCase } from './mark-notification-read.use-case';

class FakeGateway implements NotificationInboxGateway {
  readonly listCalls: NotificationQuery[] = [];
  list(query: NotificationQuery): Observable<NotificationPage> {
    this.listCalls.push(query); return of({ items: [], page: query.page, size: query.size, totalElements: 0, totalPages: 0 });
  }
  countUnread(): Observable<number> { return of(0); }
  markRead = vi.fn<(id: string) => Observable<InboxNotification>>();
  markAllRead(): Observable<void> { return of(undefined); }
}

describe('notification use cases', () => {
  it.each([1, 50])('lists using the allowed boundary size %s', async size => {
    const gateway = new FakeGateway();
    await firstValueFrom(new ListNotificationsUseCase(gateway).execute({ unreadOnly: false, page: 0, size }));
    expect(gateway.listCalls).toEqual([{ unreadOnly: false, page: 0, size }]);
  });

  it.each([{ page: -1, size: 20 }, { page: 0.5, size: 20 }, { page: 0, size: 0 }, { page: 0, size: 51 }])
  ('rejects invalid pagination before reaching the gateway', async pagination => {
    const gateway = new FakeGateway();
    await expect(firstValueFrom(new ListNotificationsUseCase(gateway).execute({ unreadOnly: false, ...pagination }))).rejects.toMatchObject({ kind: 'validation' });
    expect(gateway.listCalls).toHaveLength(0);
  });

  it('rejects a blank notification id before reaching the gateway', async () => {
    const gateway = new FakeGateway();
    await expect(firstValueFrom(new MarkNotificationReadUseCase(gateway).execute(' '))).rejects.toMatchObject({ kind: 'validation' });
    expect(gateway.markRead).not.toHaveBeenCalled();
  });
});
