import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export type NotificationTone = 'warning' | 'error';

export interface NotificationAction {
  readonly label: string;
  readonly run: () => void;
}

export interface NotificationInput {
  readonly id: string;
  readonly tone: NotificationTone;
  readonly message: string;
  readonly action?: NotificationAction;
  readonly durationMs?: number | null;
}

export interface NotificationItem extends NotificationInput {
  readonly action?: NotificationAction;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly notificationsValue = signal<readonly NotificationItem[]>([]);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  readonly notifications = this.notificationsValue.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach(timer => clearTimeout(timer)));
  }

  show(input: NotificationInput): void {
    this.dismiss(input.id);
    const current = [...this.notificationsValue(), input];
    while (current.length > 3) {
      const removed = current.shift();
      if (removed) this.clearTimer(removed.id);
    }
    this.notificationsValue.set(current);
    const duration = input.durationMs === undefined ? (input.tone === 'warning' ? 8_000 : null) : input.durationMs;
    if (duration !== null) this.timers.set(input.id, setTimeout(() => this.dismiss(input.id), duration));
  }

  dismiss(id: string): void {
    this.clearTimer(id);
    this.notificationsValue.update(items => items.filter(item => item.id !== id));
  }

  runAction(item: NotificationItem): void {
    this.dismiss(item.id);
    item.action?.run();
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) clearTimeout(timer);
    this.timers.delete(id);
  }
}
