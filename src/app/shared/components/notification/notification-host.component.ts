import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IconComponent } from '../icon/icon.component';
import { NotificationItem, NotificationService } from './notification.service';

@Component({
  selector: 'app-notification-host',
  imports: [IconComponent, TranslatePipe],
  templateUrl: './notification-host.component.html',
})
export class NotificationHostComponent {
  protected readonly notifications = inject(NotificationService);

  protected classes(item: NotificationItem): string {
    const tone = item.tone === 'error' ? 'border-ncasa-error/30 bg-ncasa-surface text-ncasa-error'
      : item.tone === 'positive' ? 'border-ncasa-forest/30 bg-ncasa-surface text-ncasa-forest'
      : 'border-ncasa-coral/30 bg-ncasa-surface text-ncasa-coral-dark';
    return `pointer-events-auto flex gap-3 rounded-2xl border p-4 shadow-xl ${tone}`;
  }

  protected icon(item: NotificationItem): string {
    return item.tone === 'error' ? 'octagon-alert' : item.tone === 'positive' ? 'circle-check' : 'triangle-alert';
  }
}
