import { Injectable, signal } from '@angular/core';

export type ConfirmDialogVariant = 'primary' | 'destructive';

export interface ConfirmDialogOptions {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly variant?: ConfirmDialogVariant;
}

export interface ConfirmDialogRequest extends ConfirmDialogOptions {
  readonly id: number;
  readonly variant: ConfirmDialogVariant;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly requestValue = signal<ConfirmDialogRequest | null>(null);
  private resolveCurrent: ((confirmed: boolean) => void) | null = null;
  private trigger: HTMLElement | null = null;
  private nextId = 0;

  readonly request = this.requestValue.asReadonly();

  open(options: ConfirmDialogOptions): Promise<boolean> {
    this.settle(false);
    this.trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.requestValue.set({
      id: ++this.nextId,
      variant: 'primary',
      ...options,
    });
    return new Promise<boolean>(resolve => { this.resolveCurrent = resolve; });
  }

  settle(confirmed: boolean): void {
    const resolve = this.resolveCurrent;
    const trigger = this.trigger;
    this.resolveCurrent = null;
    this.trigger = null;
    this.requestValue.set(null);
    resolve?.(confirmed);
    if (trigger) queueMicrotask(() => trigger.focus());
  }
}
