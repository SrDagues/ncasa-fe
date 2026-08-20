import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import es from '../../../../../public/i18n/es.json';
import { NotificationService } from '../../../shared/components/notification/notification.service';
import { HouseholdStore } from '../../household';
import { Money } from '../domain';
import { ExpenseFormStore } from '../presentation/form/expense-form.store';
import { ExpenseFormComponent } from './expense-form.component';

const members = [{ id: 'm1', accountId: 1, email: 'one@example.com', role: 'ADMIN' as const, status: 'ACTIVE' as const,
  owner: true, joinedAt: '', statusChangedAt: '' }, { id: 'm2', accountId: 2, email: 'two@example.com', role: 'MEMBER' as const,
  status: 'ACTIVE' as const, owner: false, joinedAt: '', statusChangedAt: '' }];
const household = { id: 'h1', name: 'Casa', status: 'ACTIVE' as const, ownerMemberId: 'm1', createdBy: 1, createdAt: '', members };

describe('ExpenseFormComponent', () => {
  const submitExpense = vi.fn(async () => null);
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ imports: [ExpenseFormComponent], providers: [
      provideRouter([]), provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
      { provide: HouseholdStore, useValue: { active: signal(household), members: signal(members), households: signal([
        { id: 'h1', name: 'Casa', status: 'ACTIVE', currentMemberId: 'm1', currentRole: 'ADMIN', owner: true },
      ]) } },
      { provide: ExpenseFormStore, useValue: { submit: submitExpense, pending: signal(false), error: signal(null) } },
      { provide: NotificationService, useValue: { show: vi.fn() } },
    ] });
    TestBed.inject(TranslateService).setTranslation('es', es);
  });

  it('shows accessible validation and does not submit invalid money', async () => {
    const fixture = TestBed.createComponent(ExpenseFormComponent); fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit')); await fixture.whenStable(); fixture.detectChanges();
    expect(submitExpense).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#amount-error')?.getAttribute('role')).toBe('alert');
    expect(fixture.nativeElement.querySelector('#amount')?.getAttribute('aria-describedby')).toBe('amount-error');
  });

  it('submits an equal split for all active members without floating point amounts', async () => {
    const fixture = TestBed.createComponent(ExpenseFormComponent); fixture.detectChanges();
    fill(fixture.nativeElement, '#description', 'Compra semanal'); fill(fixture.nativeElement, '#amount', '10.00');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit')); await fixture.whenStable();
    expect(submitExpense).toHaveBeenCalledWith('h1', expect.objectContaining({
      amount: expect.objectContaining({ minorUnits: 1000n, currency: 'EUR' }), payerMemberId: 'm1',
      split: { type: 'EQUAL', memberIds: expect.arrayContaining(['m1', 'm2']) },
    }));
  });
});

function fill(root: HTMLElement, selector: string, value: string): void {
  const input = root.querySelector<HTMLInputElement>(selector); if (!input) throw new Error(`Missing ${selector}`);
  input.value = value; input.dispatchEvent(new Event('input'));
}
