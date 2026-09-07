import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { InboxNotification } from '../domain/inbox-notification';
import { NotificationInboxStore } from './notification-inbox.store';
import { NotificationListItemComponent } from './notification-list-item.component';
import { NotificationTargetCoordinator } from './notification-target.coordinator';

@Component({
  selector: 'app-notification-indicator',
  imports: [RouterLink, TranslatePipe, IconComponent, NotificationListItemComponent],
  templateUrl: './notification-indicator.component.html',
  host: { '(document:click)': 'outsideClick($event)', '(document:keydown.escape)': 'escape()' },
})
export class NotificationIndicatorComponent {
  protected readonly store = inject(NotificationInboxStore);
  private readonly coordinator = inject(NotificationTargetCoordinator);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  protected readonly open = signal(false);
  protected readonly visibleCount = () => this.store.unreadCount() > 99 ? '99+' : `${this.store.unreadCount()}`;

  constructor() { this.store.initialize(); }

  protected toggle(): void {
    this.open.update(value => !value);
    if (this.open()) { void this.store.loadUnreadCount(); void this.store.loadPreview(); }
  }
  protected close(): void { this.open.set(false); }
  protected escape(): void { if (this.open()) { this.close(); this.trigger()?.nativeElement.focus(); } }
  protected outsideClick(event: Event): void {
    if (this.open() && event.target instanceof Node && !this.host.nativeElement.contains(event.target)) this.close();
  }
  protected async mark(notification: InboxNotification): Promise<void> {
    if (!await this.store.markRead(notification)) this.coordinator.notifyReadFailure();
  }
  protected async markAll(): Promise<void> {
    if (!await this.store.markAllRead()) this.coordinator.notifyMarkAllFailure();
  }
  protected async activate(notification: InboxNotification): Promise<void> {
    if (await this.coordinator.open(notification)) this.close();
  }
}
