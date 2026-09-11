import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShoppingListCollectionResult, ShoppingListDetailResult } from '../application/ports/shopping-list.gateway';
import { ShoppingListsApplication } from '../application/shopping-lists.application';
import { ShoppingItemDraft, ShoppingListDetail, ShoppingListSummary } from '../domain/shopping-list.models';
import { LAST_SHOPPING_LIST_STORAGE } from '../infrastructure/browser/last-shopping-list.storage';
import { ShoppingListsStore } from './shopping-lists.store';

describe('ShoppingListsStore', () => {
  let application: StubApplication;
  let store: ShoppingListsStore;

  beforeEach(() => {
    application = new StubApplication();
    TestBed.configureTestingModule({ providers: [
      ShoppingListsStore,
      { provide: ShoppingListsApplication, useValue: application },
      { provide: LAST_SHOPPING_LIST_STORAGE, useValue: { read: () => null, write: vi.fn(), remove: vi.fn() } },
    ] });
    store = TestBed.inject(ShoppingListsStore);
  });

  afterEach(() => {
    store.stopPolling();
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('uses the exact content revision returned by the add operation', async () => {
    await store.initialize('h1');
    application.addedList = { ...list, contentRevision: 12 };

    await store.addItem(draft);

    expect(store.current()?.contentRevision).toBe(12);
    expect(store.pending().map(item => item.id)).toEqual(['i1', 'i2']);
  });

  it('keeps active-list state independent while loading the trash', async () => {
    await store.initialize('h1');
    application.trashed = [{ ...list, id: 'trashed', name: 'Old list', status: 'TRASHED' }];

    await store.loadTrash();

    expect(store.state()).toBe('ready');
    expect(store.current()?.id).toBe('l1');
    expect(store.trashState()).toBe('ready');
  });

  it('polls detail every 15 seconds and the collection every 60 seconds, then cancels both', async () => {
    vi.useFakeTimers();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    await store.initialize('h1');
    store.startPolling();

    await vi.advanceTimersByTimeAsync(60_000);

    expect(application.get).toHaveBeenCalledTimes(5);
    expect(application.list).toHaveBeenCalledTimes(2);
    store.stopPolling();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(application.get).toHaveBeenCalledTimes(5);
    expect(application.list).toHaveBeenCalledTimes(2);
  });

  it('resets household-specific state when there is no active household', async () => {
    await store.initialize('h1');

    store.reset();

    expect(store.state()).toBe('initial');
    expect(store.current()).toBeNull();
    expect(store.lists()).toEqual([]);
  });

  it('ignores a late collection response from the previous household', async () => {
    const previousHousehold = new Subject<ShoppingListCollectionResult>();
    application.list
      .mockImplementationOnce(() => previousHousehold)
      .mockImplementationOnce(() => of({ kind: 'loaded', lists: [secondList], etag: '"second"' }));
    application.get.mockImplementation((_, listId) => of({
      kind: 'loaded', detail: listId === secondList.id ? secondDetail : detail, etag: '"detail"',
    }));

    const firstInitialization = store.initialize('h1');
    await store.initialize('h2');
    previousHousehold.next({ kind: 'loaded', lists: [list], etag: '"first"' });
    previousHousehold.complete();
    await firstInitialization;

    expect(store.current()?.id).toBe('l2');
    expect(store.lists().map(value => value.id)).toEqual(['l2']);
  });
});

class StubApplication {
  trashed: readonly ShoppingListSummary[] = [];
  addedList: ShoppingListSummary = { ...list, contentRevision: 8 };
  readonly list = vi.fn((_: string, trashed = false, __?: string): Observable<ShoppingListCollectionResult> =>
    of({ kind: 'loaded', lists: trashed ? this.trashed : [list], etag: trashed ? '"trash"' : '"active"' }));
  readonly get = vi.fn((_: string, __: string, ___?: string): Observable<ShoppingListDetailResult> => of({ kind: 'loaded', detail, etag: '"detail"' }));
  readonly calendarOptions = vi.fn(() => of([]));
  readonly addItem = vi.fn(() => of({ item: addedItem, list: this.addedList }));
}

const list: ShoppingListSummary = {
  id: 'l1', name: 'Compra semanal', calendarSeriesId: null, status: 'ACTIVE', createdByMemberId: 'm1',
  createdAt: '2026-09-11T10:00:00Z', updatedAt: '2026-09-11T10:00:00Z', deletedAt: null, version: 2, contentRevision: 7,
};
const firstItem = {
  id: 'i1', listId: 'l1', name: 'Pan', quantity: 1, unit: 'UNIT' as const, customUnit: null, note: null,
  responsibleMemberId: null, addedByMemberId: 'm1', purchasedByMemberId: null, status: 'PENDING' as const, position: 0,
  createdAt: '2026-09-11T10:00:00Z', updatedAt: '2026-09-11T10:00:00Z', purchasedAt: null, version: 0,
};
const addedItem = { ...firstItem, id: 'i2', name: 'Leche', position: 1 };
const detail: ShoppingListDetail = { list, pending: [firstItem], purchased: [] };
const secondList: ShoppingListSummary = { ...list, id: 'l2', name: 'Ferretería' };
const secondDetail: ShoppingListDetail = { list: secondList, pending: [], purchased: [] };
const draft: ShoppingItemDraft = { name: 'Leche', quantity: 2, unit: 'LITER', customUnit: '', note: '', responsibleMemberId: null };
