import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { InboxNotification } from '../domain/inbox-notification';
import { NotificationInboxStore } from './notification-inbox.store';
import { NotificationListItemComponent } from './notification-list-item.component';
import { NotificationTargetCoordinator } from './notification-target.coordinator';

@Component({
  selector: 'app-notification-inbox',
  imports: [TranslatePipe, ButtonComponent, EmptyStateComponent, NotificationListItemComponent],
  templateUrl: './notification-inbox.component.html',
})
export class NotificationInboxComponent {
  protected readonly store = inject(NotificationInboxStore);
  private readonly coordinator = inject(NotificationTargetCoordinator);

  constructor() { void this.store.loadPage(0, false); void this.store.loadUnreadCount(); }

  protected filter(unreadOnly: boolean): void {
    if (unreadOnly !== this.store.unreadOnly()) void this.store.setUnreadOnly(unreadOnly);
  }
  protected previous(): void { const page = this.store.page()?.page ?? 0; if (page > 0) void this.store.loadPage(page - 1); }
  protected next(): void {
    const page = this.store.page(); if (page && page.page + 1 < page.totalPages) void this.store.loadPage(page.page + 1);
  }
  protected async mark(notification: InboxNotification): Promise<void> {
    if (!await this.store.markRead(notification)) this.coordinator.notifyReadFailure();
  }
  protected async markAll(): Promise<void> {
    if (!await this.store.markAllRead()) this.coordinator.notifyMarkAllFailure();
  }
  protected activate(notification: InboxNotification): void { void this.coordinator.open(notification); }
}
