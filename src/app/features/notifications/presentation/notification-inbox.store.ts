import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { NotificationApplicationError } from '../application/notification.errors';
import { NotificationPage } from '../application/notification.models';
import { NotificationRefreshTrigger } from '../application/ports/notification-inbox.gateway';
import { CountUnreadNotificationsUseCase } from '../application/use-cases/count-unread-notifications.use-case';
import { ListNotificationsUseCase } from '../application/use-cases/list-notifications.use-case';
import { MarkAllNotificationsReadUseCase } from '../application/use-cases/mark-all-notifications-read.use-case';
import { MarkNotificationReadUseCase } from '../application/use-cases/mark-notification-read.use-case';
import { InboxNotification } from '../domain/inbox-notification';

export type NotificationLoadState = 'initial' | 'loading' | 'ready' | 'empty' | 'error';

@Injectable()
export class NotificationInboxStore {
  private readonly listNotifications = inject(ListNotificationsUseCase);
  private readonly countUnreadNotifications = inject(CountUnreadNotificationsUseCase);
  private readonly markNotificationRead = inject(MarkNotificationReadUseCase);
  private readonly markAllNotificationsRead = inject(MarkAllNotificationsReadUseCase);
  private countPromise: Promise<void> | null = null;
  private countRefreshQueued = false;
  private countRevision = 0;
  private previewPromise: Promise<void> | null = null;
  private readonly pendingReadPromises = new Map<string, Promise<boolean>>();
  private pageRequest = 0;
  private initialized = false;

  private readonly unreadCountValue = signal(0);
  private readonly countStateValue = signal<NotificationLoadState>('initial');
  private readonly previewValue = signal<NotificationPage | null>(null);
  private readonly previewStateValue = signal<NotificationLoadState>('initial');
  private readonly previewErrorValue = signal<NotificationApplicationError | null>(null);
  private readonly pageValue = signal<NotificationPage | null>(null);
  private readonly pageStateValue = signal<NotificationLoadState>('initial');
  private readonly pageErrorValue = signal<NotificationApplicationError | null>(null);
  private readonly unreadOnlyValue = signal(false);
  private readonly pendingIdsValue = signal<ReadonlySet<string>>(new Set());
  private readonly markAllPendingValue = signal(false);
  private readonly mutationErrorValue = signal<NotificationApplicationError | null>(null);

  readonly unreadCount = this.unreadCountValue.asReadonly();
  readonly countState = this.countStateValue.asReadonly();
  readonly preview = this.previewValue.asReadonly();
  readonly previewState = this.previewStateValue.asReadonly();
  readonly previewError = this.previewErrorValue.asReadonly();
  readonly page = this.pageValue.asReadonly();
  readonly pageState = this.pageStateValue.asReadonly();
  readonly pageError = this.pageErrorValue.asReadonly();
  readonly unreadOnly = this.unreadOnlyValue.asReadonly();
  readonly pendingIds = this.pendingIdsValue.asReadonly();
  readonly markAllPending = this.markAllPendingValue.asReadonly();
  readonly mutationError = this.mutationErrorValue.asReadonly();

  constructor() {
    inject(NotificationRefreshTrigger).focusChanges.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => void this.loadUnreadCount());
  }

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true; void this.loadUnreadCount();
  }

  loadUnreadCount(forceAfterCurrent = false): Promise<void> {
    if (this.countPromise) {
      if (forceAfterCurrent) this.countRefreshQueued = true;
      return this.countPromise;
    }
    const revision = this.countRevision;
    this.countStateValue.set('loading');
    this.countPromise = firstValueFrom(this.countUnreadNotifications.execute())
      .then(count => {
        if (revision === this.countRevision) this.unreadCountValue.set(Math.max(0, count));
        this.countStateValue.set('ready');
      })
      .catch(() => this.countStateValue.set('error'))
      .finally(() => {
        this.countPromise = null;
        if (this.countRefreshQueued) { this.countRefreshQueued = false; void this.loadUnreadCount(); }
      });
    return this.countPromise;
  }

  loadPreview(): Promise<void> {
    if (this.previewPromise) return this.previewPromise;
    this.previewStateValue.set('loading'); this.previewErrorValue.set(null);
    this.previewPromise = firstValueFrom(this.listNotifications.execute({ unreadOnly: true, page: 0, size: 5 }))
      .then(page => { this.previewValue.set(page); this.previewStateValue.set(page.items.length ? 'ready' : 'empty'); })
      .catch(error => { this.previewErrorValue.set(asNotificationError(error)); this.previewStateValue.set('error'); })
      .finally(() => this.previewPromise = null);
    return this.previewPromise;
  }

  async loadPage(page = 0, unreadOnly = this.unreadOnlyValue()): Promise<void> {
    const request = ++this.pageRequest;
    this.unreadOnlyValue.set(unreadOnly); this.pageStateValue.set('loading'); this.pageErrorValue.set(null);
    try {
      const result = await firstValueFrom(this.listNotifications.execute({ unreadOnly, page, size: 20 }));
      if (request !== this.pageRequest) return;
      this.pageValue.set(result); this.pageStateValue.set(result.items.length ? 'ready' : 'empty');
    } catch (error) {
      if (request !== this.pageRequest) return;
      this.pageErrorValue.set(asNotificationError(error)); this.pageStateValue.set('error');
    }
  }

  setUnreadOnly(unreadOnly: boolean): Promise<void> { return this.loadPage(0, unreadOnly); }

  markRead(notification: InboxNotification): Promise<boolean> {
    if (!notification.isUnread) return Promise.resolve(true);
    const current = this.pendingReadPromises.get(notification.id);
    if (current) return current;
    const operation = this.performMarkRead(notification).finally(() => {
      this.pendingReadPromises.delete(notification.id);
      this.pendingIdsValue.update(ids => { const next = new Set(ids); next.delete(notification.id); return next; });
    });
    this.pendingReadPromises.set(notification.id, operation);
    return operation;
  }

  private async performMarkRead(notification: InboxNotification): Promise<boolean> {
    this.pendingIdsValue.update(ids => new Set([...ids, notification.id])); this.mutationErrorValue.set(null);
    try {
      const updated = await firstValueFrom(this.markNotificationRead.execute(notification.id));
      this.replaceNotification(updated);
      this.countRevision++;
      this.unreadCountValue.update(count => Math.max(0, count - 1));
      void this.loadUnreadCount(true); void this.loadPreview();
      return true;
    } catch (error) {
      this.mutationErrorValue.set(asNotificationError(error)); return false;
    }
  }

  async markAllRead(): Promise<boolean> {
    if (this.markAllPendingValue()) return false;
    this.markAllPendingValue.set(true); this.mutationErrorValue.set(null);
    try {
      await firstValueFrom(this.markAllNotificationsRead.execute());
      this.countRevision++;
      this.unreadCountValue.set(0);
      this.previewValue.set(emptyPage(5)); this.previewStateValue.set('empty');
      const currentPage = this.pageValue();
      if (currentPage) void this.loadPage(currentPage.page, this.unreadOnlyValue());
      void this.loadUnreadCount(true);
      return true;
    } catch (error) {
      this.mutationErrorValue.set(asNotificationError(error)); return false;
    } finally { this.markAllPendingValue.set(false); }
  }

  clearMutationError(): void { this.mutationErrorValue.set(null); }

  private replaceNotification(notification: InboxNotification): void {
    const replace = (page: NotificationPage | null): NotificationPage | null => page === null ? null : {
      ...page, items: page.items.map(item => item.id === notification.id ? notification : item),
    };
    this.pageValue.update(replace); this.previewValue.update(replace);
  }
}

const emptyPage = (size: number): NotificationPage => ({ items: [], page: 0, size, totalElements: 0, totalPages: 0 });
const asNotificationError = (error: unknown): NotificationApplicationError => error instanceof NotificationApplicationError
  ? error : new NotificationApplicationError('unexpected', error instanceof Error ? error.message : 'Unexpected notification error');
