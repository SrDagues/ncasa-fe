import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../shared/components/notification/notification.service';
import { HouseholdStore } from '../../household';
import { InboxNotification } from '../domain/inbox-notification';
import { NotificationInboxStore } from './notification-inbox.store';

@Injectable()
export class NotificationTargetCoordinator {
  private readonly store = inject(NotificationInboxStore);
  private readonly household = inject(HouseholdStore);
  private readonly router = inject(Router);
  private readonly toast = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  async open(notification: InboxNotification): Promise<boolean> {
    const readPromise = notification.isUnread ? this.store.markRead(notification) : Promise.resolve(true);
    if (this.household.active()?.id !== notification.householdId) await this.household.select(notification.householdId);
    if (this.household.active()?.id !== notification.householdId) {
      this.notify('persistentNotifications.errors.household');
      void readPromise.then(ok => { if (!ok) this.notify('persistentNotifications.errors.read'); });
      return false;
    }
    const navigated = await this.router.navigate(['/app/expenses/plans', notification.planId]);
    void readPromise.then(ok => { if (!ok) this.notify('persistentNotifications.errors.read'); });
    return navigated;
  }

  notifyReadFailure(): void { this.notify('persistentNotifications.errors.read'); }
  notifyMarkAllFailure(): void { this.notify('persistentNotifications.errors.markAll'); }

  private notify(key: string): void {
    this.toast.show({ id: key, tone: 'error', message: this.translate.instant(key), durationMs: 8_000 });
  }
}
