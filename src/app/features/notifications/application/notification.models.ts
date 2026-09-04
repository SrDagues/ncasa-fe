import { InboxNotification } from '../domain/inbox-notification';

export interface NotificationQuery {
  readonly unreadOnly: boolean;
  readonly page: number;
  readonly size: number;
}

export interface NotificationPage {
  readonly items: readonly InboxNotification[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}
