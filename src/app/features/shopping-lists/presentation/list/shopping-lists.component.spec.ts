import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import es from '../../../../../../public/i18n/es.json';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { HouseholdStore } from '../../../household';
import { ShoppingListsStore } from '../shopping-lists.store';
import { ShoppingListsComponent } from './shopping-lists.component';

const household = { id: 'h1', name: 'Casa', status: 'ACTIVE' as const, ownerMemberId: 'm1', createdBy: 1,
  createdAt: '', members: [] };
const list = { id: 'l1', name: 'Compra semanal', calendarSeriesId: null, status: 'ACTIVE' as const,
  createdByMemberId: 'm1', createdAt: '', updatedAt: '', deletedAt: null, version: 0, contentRevision: 2 };
const purchased = { id: 'i1', listId: 'l1', name: 'Leche', quantity: 2, unit: 'LITER' as const,
  customUnit: null, note: null, responsibleMemberId: null, addedByMemberId: 'm1', purchasedByMemberId: 'm1',
  status: 'PURCHASED' as const, position: 0, createdAt: '', updatedAt: '', purchasedAt: '2026-09-11T10:00:00Z', version: 1 };

describe('ShoppingListsComponent reuse flow', () => {
  const reusePurchased = vi.fn(async () => true);
  const open = vi.fn(async () => true);
  const store = {
    error: signal(null), state: signal('ready'), current: signal(list), lists: signal([list]), pending: signal([]),
    purchased: signal([purchased]), refreshing: signal(false), busy: signal<string | null>(null), calendarOptions: signal([]),
    initialize: vi.fn(async () => undefined), reset: vi.fn(), startPolling: vi.fn(), stopPolling: vi.fn(), clearError: vi.fn(),
    addItem: vi.fn(), select: vi.fn(), reorderPending: vi.fn(), setPurchased: vi.fn(), deleteItem: vi.fn(),
    clearPurchased: vi.fn(), moveCurrentToTrash: vi.fn(), refreshCalendarOptions: vi.fn(), create: vi.fn(),
    updateList: vi.fn(), updateItem: vi.fn(), reusePurchased,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ imports: [ShoppingListsComponent], providers: [
      provideRouter([]), provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
      { provide: HouseholdStore, useValue: { active: signal(household), members: signal([]) } },
      { provide: ShoppingListsStore, useValue: store },
      { provide: ConfirmDialogService, useValue: { open } },
    ] });
    TestBed.inject(TranslateService).setTranslation('es', es);
  });

  it('confirms the number of purchased products before reusing them', async () => {
    const fixture = TestBed.createComponent(ShoppingListsComponent);
    fixture.detectChanges();

    buttonWithText(fixture.nativeElement, 'Reutilizar comprados').click();
    await fixture.whenStable();

    expect(open).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Preparar nueva compra', message: expect.stringContaining('1 producto'), variant: 'primary',
    }));
    expect(reusePurchased).toHaveBeenCalledOnce();
  });
});

function buttonWithText(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(value => value.textContent?.includes(text));
  if (!button) throw new Error(`Missing button: ${text}`);
  return button;
}
