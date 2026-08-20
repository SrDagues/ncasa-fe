import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, expect, it } from 'vitest';
import { ConfirmDialogHostComponent } from './confirm-dialog-host.component';
import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialog', () => {
  let service: ConfirmDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ConfirmDialogHostComponent] });
    service = TestBed.inject(ConfirmDialogService);
    HTMLDialogElement.prototype.showModal ??= function showModal(): void { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close ??= function close(): void { this.removeAttribute('open'); };
  });

  it('resolves true only after the user confirms', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogHostComponent);
    fixture.detectChanges();

    const result = service.open({ title: 'Archive household', message: 'This cannot be undone', confirmLabel: 'Archive', cancelLabel: 'Cancel', variant: 'destructive' });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-confirm]')?.click();

    await expect(result).resolves.toBe(true);
  });

  it('cancels with the cancel button, Escape, or a backdrop click', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogHostComponent);
    fixture.detectChanges();

    const byButton = service.open({ title: 'Leave', message: 'Leave this household?', confirmLabel: 'Leave', cancelLabel: 'Cancel' });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-cancel]')?.click();
    await expect(byButton).resolves.toBe(false);

    const byEscape = service.open({ title: 'Leave', message: 'Leave this household?', confirmLabel: 'Leave', cancelLabel: 'Cancel' });
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    await expect(byEscape).resolves.toBe(false);

    const byBackdrop = service.open({ title: 'Leave', message: 'Leave this household?', confirmLabel: 'Leave', cancelLabel: 'Cancel' });
    fixture.detectChanges();
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await expect(byBackdrop).resolves.toBe(false);
  });

  it('focuses cancel first and restores focus to the trigger', async () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const fixture = TestBed.createComponent(ConfirmDialogHostComponent);
    fixture.detectChanges();

    const result = service.open({ title: 'Remove', message: 'Remove member?', confirmLabel: 'Remove', cancelLabel: 'Cancel' });
    fixture.detectChanges();
    await Promise.resolve();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('[data-cancel] button'));

    fixture.nativeElement.querySelector('[data-cancel]')?.click();
    await result;
    await Promise.resolve();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
