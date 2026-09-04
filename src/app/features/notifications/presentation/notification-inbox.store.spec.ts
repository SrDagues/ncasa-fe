import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationApplicationError } from '../application/notification.errors';
import { NotificationPage } from '../application/notification.models';
import { NotificationRefreshTrigger } from '../application/ports/notification-inbox.gateway';
import { CountUnreadNotificationsUseCase } from '../application/use-cases/count-unread-notifications.use-case';
import { ListNotificationsUseCase } from '../application/use-cases/list-notifications.use-case';
import { MarkAllNotificationsReadUseCase } from '../application/use-cases/mark-all-notifications-read.use-case';
import { MarkNotificationReadUseCase } from '../application/use-cases/mark-notification-read.use-case';
import { InboxNotification, NotificationAmount } from '../domain/inbox-notification';
import { NotificationInboxStore } from './notification-inbox.store';

const item = (readAt: string | null = null) => new InboxNotification({
  id: 'n1', kind: 'EXPENSE_PLAN_OCCURRENCE_APPROACHING', householdId: 'h1', planId: 'p1', subject: 'Rent',
  amount: NotificationAmount.fromDecimal('10.00', 'EUR'), occurrenceDate: '2026-09-10', occurrenceNumber: 1,
  totalOccurrences: 2, attentionReason: null, occurredAt: '2026-09-04T08:00:00Z',
  createdAt: '2026-09-04T08:00:01Z', readAt,
});
const page = (items: readonly InboxNotification[], number = 0): NotificationPage => ({
  items, page: number, size: 20, totalElements: items.length, totalPages: items.length ? 1 : 0,
});

describe('NotificationInboxStore', () => {
  let focus: Subject<void>;
  let listResponses: Subject<NotificationPage>[];
  let count: ReturnType<typeof vi.fn>;
  let markRead: ReturnType<typeof vi.fn>;
  let markAll: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    focus = new Subject<void>(); listResponses = []; count = vi.fn(() => of(3)); markRead = vi.fn(() => of(item('2026-09-04T09:00:00Z')));
    markAll = vi.fn(() => of(undefined));
    TestBed.configureTestingModule({ providers: [
      NotificationInboxStore,
      { provide: NotificationRefreshTrigger, useValue: { focusChanges: focus } },
      { provide: CountUnreadNotificationsUseCase, useValue: { execute: count } },
      { provide: ListNotificationsUseCase, useValue: { execute: () => { const response = new Subject<NotificationPage>(); listResponses.push(response); return response; } } },
      { provide: MarkNotificationReadUseCase, useValue: { execute: markRead } },
      { provide: MarkAllNotificationsReadUseCase, useValue: { execute: markAll } },
    ] });
  });

  it('loads the counter once on initialization and refreshes it on focus', async () => {
    const store = TestBed.inject(NotificationInboxStore); store.initialize(); store.initialize();
    await vi.waitFor(() => expect(store.countState()).toBe('ready'));
    expect(count).toHaveBeenCalledTimes(1); expect(store.unreadCount()).toBe(3);
    focus.next(); await vi.waitFor(() => expect(count).toHaveBeenCalledTimes(2));
  });

  it('ignores a stale page after the filter changes', async () => {
    const store = TestBed.inject(NotificationInboxStore);
    const first = store.loadPage(1, false); const second = store.setUnreadOnly(true);
    listResponses[1].next(page([], 0)); listResponses[1].complete(); await second;
    listResponses[0].next(page([item()], 1)); listResponses[0].complete(); await first;
    expect(store.page()?.items).toEqual([]); expect(store.unreadOnly()).toBe(true); expect(store.pageState()).toBe('empty');
  });

  it('updates every projection and never makes the count negative after reading', async () => {
    count.mockReturnValue(of(0)); const store = TestBed.inject(NotificationInboxStore);
    const loadingPage = store.loadPage(); listResponses[0].next(page([item()])); listResponses[0].complete(); await loadingPage;
    expect(await store.markRead(item())).toBe(true);
    expect(store.page()?.items[0].isUnread).toBe(false); expect(store.unreadCount()).toBe(0);
    expect(markRead).toHaveBeenCalledTimes(1);
  });

  it('preserves unread state when marking read fails', async () => {
    markRead.mockReturnValue(throwError(() => new NotificationApplicationError('network', 'offline')));
    const store = TestBed.inject(NotificationInboxStore);
    const loadingPage = store.loadPage(); listResponses[0].next(page([item()])); listResponses[0].complete(); await loadingPage;
    expect(await store.markRead(item())).toBe(false);
    expect(store.page()?.items[0].isUnread).toBe(true); expect(store.mutationError()?.kind).toBe('network');
  });

  it('shares one request when the same notification is marked twice', async () => {
    const response = new Subject<InboxNotification>(); markRead.mockReturnValue(response);
    const store = TestBed.inject(NotificationInboxStore);
    const first = store.markRead(item()); const second = store.markRead(item());
    expect(second).toBe(first); expect(markRead).toHaveBeenCalledTimes(1);
    response.next(item('2026-09-04T09:00:00Z')); response.complete();
    expect(await first).toBe(true); expect(await second).toBe(true);
  });

  it('does not let a stale count undo a successful read and refreshes afterwards', async () => {
    const stale = new Subject<number>(); count.mockReturnValueOnce(stale).mockReturnValueOnce(of(0));
    const store = TestBed.inject(NotificationInboxStore); store.initialize();
    expect(await store.markRead(item())).toBe(true);
    stale.next(3); stale.complete();
    await vi.waitFor(() => expect(count).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(store.unreadCount()).toBe(0));
  });

  it('marks all only once while the operation is pending', async () => {
    const response = new Subject<void>(); markAll.mockReturnValue(response); count.mockReturnValue(of(0));
    const store = TestBed.inject(NotificationInboxStore);
    const first = store.markAllRead(); expect(await store.markAllRead()).toBe(false);
    response.next(); response.complete();
    expect(await first).toBe(true); expect(markAll).toHaveBeenCalledTimes(1); expect(store.unreadCount()).toBe(0);
  });
});
