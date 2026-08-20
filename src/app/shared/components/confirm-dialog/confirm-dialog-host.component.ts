import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog-host',
  imports: [ButtonComponent],
  templateUrl: './confirm-dialog-host.component.html',
})
export class ConfirmDialogHostComponent {
  protected readonly dialogs = inject(ConfirmDialogService);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly cancelButton = viewChild('cancelButton', { read: ElementRef<HTMLButtonElement> });

  constructor() {
    effect(() => {
      const request = this.dialogs.request();
      const dialog = this.dialog()?.nativeElement;
      if (!dialog) return;
      if (request && !dialog.open) {
        try { dialog.showModal(); } catch { dialog.setAttribute('open', ''); }
        queueMicrotask(() => this.cancelButton()?.nativeElement.querySelector('button')?.focus());
      } else if (!request && dialog.open) {
        try { dialog.close(); } catch { dialog.removeAttribute('open'); }
      }
    });
  }

  protected cancel(event?: Event): void {
    event?.preventDefault();
    this.dialogs.settle(false);
  }

  protected confirm(): void { this.dialogs.settle(true); }

  protected backdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel();
  }
}
