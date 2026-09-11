import { Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedCurrencyPipe, LocalizedDatePipe, LocalizedDateTimePipe } from '../../../core/i18n/localized-format.pipe';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { InboxNotification, NotificationKind } from '../domain/inbox-notification';

@Component({
  selector: 'app-notification-list-item',
  imports: [TranslatePipe, LocalizedCurrencyPipe, LocalizedDatePipe, LocalizedDateTimePipe, IconComponent],
  templateUrl: './notification-list-item.component.html',
})
export class NotificationListItemComponent {
  readonly notification = input.required<InboxNotification>();
  readonly readPending = input(false);
  readonly openNotification = output<InboxNotification>();
  readonly markRead = output<InboxNotification>();
  protected readonly target = computed(() => this.notification().kind === 'CALENDAR_TASK_COMPLETED'
    ? `/app/calendar/${encodeURIComponent(this.notification().calendarEntryId!)}`
    : `/app/expenses/plans/${encodeURIComponent(this.notification().planId!)}`);
  protected readonly kindKey = computed(() => KIND_KEYS[this.notification().kind]);

  protected open(event: Event): void { event.preventDefault(); this.openNotification.emit(this.notification()); }
}

const KIND_KEYS: Readonly<Record<NotificationKind, string>> = {
  EXPENSE_PLAN_OCCURRENCE_APPROACHING: 'persistentNotifications.kinds.occurrence',
  EXPENSE_PLAN_LAST_INSTALLMENT_APPROACHING: 'persistentNotifications.kinds.lastInstallment',
  EXPENSE_PLAN_ATTENTION_REQUIRED: 'persistentNotifications.kinds.attention',
  CALENDAR_TASK_COMPLETED: 'persistentNotifications.kinds.taskCompleted',
};
