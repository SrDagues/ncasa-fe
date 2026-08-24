import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import es from '../../../../../public/i18n/es.json';
import { HouseholdStore } from '../../household';
import { ExpenseListStore } from '../presentation/list/expense-list.store';
import { ExpenseListComponent } from './expense-list.component';

describe('ExpenseListComponent request coordination', () => {
  it('does not reload expenses when the category catalog finishes loading', async () => {
    const categories = signal<readonly unknown[]>([]);
    const load = vi.fn(async () => undefined);
    const loadCategories = vi.fn(async () => { categories.set([{ id: 'c1' }]); });
    const household = { id: 'h1', name: 'Casa', status: 'ACTIVE', ownerMemberId: 'm1', createdBy: 1, createdAt: '', members: [] };
    TestBed.configureTestingModule({ imports: [ExpenseListComponent], providers: [
      provideRouter([]), provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
      { provide: HouseholdStore, useValue: { active: signal(household), state: signal('ready'), households: signal([]) } },
      { provide: ExpenseListStore, useValue: { load, loadCategories, reset: vi.fn(), categories, state: signal('empty'), result: signal(null), error: signal(null) } },
    ] });
    TestBed.inject(TranslateService).setTranslation('es', es);
    const fixture = TestBed.createComponent(ExpenseListComponent);
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges(); await fixture.whenStable();
    expect(loadCategories).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
