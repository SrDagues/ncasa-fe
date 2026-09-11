import { computed, inject, Injectable, signal } from '@angular/core';
import { filter, firstValueFrom, fromEvent, merge, Subscription, timer } from 'rxjs';
import { ShoppingListApplicationError } from '../application/shopping-list.errors';
import { LastShoppingListStoragePort } from '../application/ports/shopping-list.gateway';
import { ShoppingListsApplication } from '../application/shopping-lists.application';
import { CalendarSeriesOption, ShoppingItem, ShoppingItemDraft, ShoppingListDetail, ShoppingListSummary } from '../domain/shopping-list.models';
import { LAST_SHOPPING_LIST_STORAGE } from '../infrastructure/browser/last-shopping-list.storage';

export type ShoppingListsLoadState = 'initial' | 'loading' | 'empty' | 'ready' | 'error';

@Injectable()
export class ShoppingListsStore {
  private readonly application = inject(ShoppingListsApplication);
  private readonly storage = inject<LastShoppingListStoragePort>(LAST_SHOPPING_LIST_STORAGE);
  private readonly stateValue = signal<ShoppingListsLoadState>('initial');
  private readonly listsValue = signal<readonly ShoppingListSummary[]>([]);
  private readonly detailValue = signal<ShoppingListDetail | null>(null);
  private readonly trashValue = signal<readonly ShoppingListSummary[]>([]);
  private readonly calendarOptionsValue = signal<readonly CalendarSeriesOption[]>([]);
  private readonly errorValue = signal<ShoppingListApplicationError | null>(null);
  private readonly busyValue = signal<string | null>(null);
  private readonly refreshingValue = signal(false);
  private householdId: string | null = null;
  private etag: string | undefined;
  private polling?: Subscription;

  readonly state = this.stateValue.asReadonly();
  readonly lists = this.listsValue.asReadonly();
  readonly detail = this.detailValue.asReadonly();
  readonly trash = this.trashValue.asReadonly();
  readonly calendarOptions = this.calendarOptionsValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly busy = this.busyValue.asReadonly();
  readonly refreshing = this.refreshingValue.asReadonly();
  readonly current = computed(() => this.detailValue()?.list ?? null);
  readonly pending = computed(() => this.detailValue()?.pending ?? []);
  readonly purchased = computed(() => this.detailValue()?.purchased ?? []);

  async initialize(householdId: string): Promise<void> {
    if (this.householdId === householdId && this.stateValue() !== 'initial') return;
    this.householdId = householdId;
    this.etag = undefined;
    this.detailValue.set(null);
    this.stateValue.set('loading');
    this.errorValue.set(null);
    try {
      const [lists, options] = await Promise.all([
        firstValueFrom(this.application.list(householdId)),
        firstValueFrom(this.application.calendarOptions(householdId)),
      ]);
      this.listsValue.set(lists);
      this.calendarOptionsValue.set(options);
      if (!lists.length) { this.stateValue.set('empty'); return; }
      const saved = this.storage.read(householdId);
      await this.select(lists.find(item => item.id === saved)?.id ?? lists[0].id);
    } catch (failure) { this.fail(failure, 'error'); }
  }

  async select(listId: string): Promise<void> {
    if (!this.householdId || this.current()?.id === listId) return;
    this.etag = undefined;
    await this.loadDetail(listId, false);
    if (this.detailValue()) this.storage.write(this.householdId, listId);
  }

  startPolling(): void {
    this.polling?.unsubscribe();
    const visibleAgain = fromEvent(document, 'visibilitychange').pipe(filter(() => document.visibilityState === 'visible'));
    this.polling = merge(timer(15_000, 15_000), visibleAgain).pipe(filter(() => document.visibilityState === 'visible'))
      .subscribe(() => void this.refresh());
  }

  stopPolling(): void { this.polling?.unsubscribe(); this.polling = undefined; }

  async refresh(): Promise<void> {
    const id = this.current()?.id;
    if (!id || this.refreshingValue()) return;
    this.refreshingValue.set(true);
    try { await this.loadDetail(id, true); }
    finally { this.refreshingValue.set(false); }
  }

  async create(name: string): Promise<boolean> {
    return this.mutate('create', async householdId => {
      const created = await firstValueFrom(this.application.create(householdId, name));
      this.listsValue.update(values => [created, ...values]);
      this.stateValue.set('ready');
      await this.select(created.id);
    });
  }

  async updateList(name: string, calendarSeriesId: string | null): Promise<boolean> {
    const list = this.current(); if (!list) return false;
    return this.mutate('settings', async householdId => {
      const updated = await firstValueFrom(this.application.update(householdId, list, name, calendarSeriesId));
      this.replaceList(updated); this.updateDetailList(updated); this.etag = undefined;
    });
  }

  async moveCurrentToTrash(): Promise<boolean> {
    const list = this.current(); if (!list) return false;
    return this.mutate('trash', async householdId => {
      await firstValueFrom(this.application.trash(householdId, list));
      const remaining = this.listsValue().filter(item => item.id !== list.id);
      this.listsValue.set(remaining); this.detailValue.set(null); this.etag = undefined; this.storage.remove(householdId);
      if (remaining.length) await this.select(remaining[0].id); else this.stateValue.set('empty');
    });
  }

  async addItem(draft: ShoppingItemDraft): Promise<boolean> {
    const list = this.current(); if (!list) return false;
    return this.mutate('add', async householdId => {
      const item = await firstValueFrom(this.application.addItem(householdId, list.id, draft));
      const updated = { ...list, contentRevision: list.contentRevision + 1, updatedAt: item.updatedAt };
      this.detailValue.update(value => value ? { list: updated, pending: [...value.pending, item], purchased: value.purchased } : value);
      this.replaceList(updated); this.etag = undefined;
    });
  }

  async setPurchased(item: ShoppingItem, purchased: boolean): Promise<boolean> {
    const list = this.current(); const before = this.detailValue(); if (!list || !before) return false;
    this.optimisticStatus(item, purchased);
    return this.mutate(`status:${item.id}`, async householdId => {
      await firstValueFrom(this.application.setPurchased(householdId, list.id, item, purchased));
      await this.reloadAfterMutation();
    }, before);
  }

  async updateItem(item: ShoppingItem, draft: ShoppingItemDraft): Promise<boolean> {
    const list = this.current(); if (!list) return false;
    return this.mutate(`edit:${item.id}`, async householdId => {
      await firstValueFrom(this.application.updateItem(householdId, list.id, item, draft));
      await this.reloadAfterMutation();
    });
  }

  async reorderPending(ids: readonly string[]): Promise<boolean> {
    const list = this.current(); const before = this.detailValue(); if (!list || !before) return false;
    const byId = new Map(before.pending.map(item => [item.id, item]));
    this.detailValue.set({ ...before, pending: ids.map(id => byId.get(id)).filter((item): item is ShoppingItem => Boolean(item)) });
    return this.mutate('reorder', async householdId => { const updated = await firstValueFrom(this.application.reorder(householdId, list, ids)); this.updateDetailList(updated); this.replaceList(updated); this.etag = undefined; }, before);
  }

  async deleteItem(item: ShoppingItem): Promise<boolean> {
    const list = this.current(); if (!list) return false;
    return this.mutate(`delete:${item.id}`, async householdId => { await firstValueFrom(this.application.deleteItem(householdId, list.id, item)); await this.reloadAfterMutation(); });
  }

  async clearPurchased(): Promise<boolean> {
    const list = this.current(); if (!list) return false;
    return this.mutate('clear', async householdId => { await firstValueFrom(this.application.clearPurchased(householdId, list)); await this.reloadAfterMutation(); });
  }

  async loadTrash(): Promise<void> {
    if (!this.householdId) return;
    this.stateValue.set('loading'); this.errorValue.set(null);
    try { const values = await firstValueFrom(this.application.list(this.householdId, true)); this.trashValue.set(values); this.stateValue.set(values.length ? 'ready' : 'empty'); }
    catch (failure) { this.fail(failure, 'error'); }
  }

  async restore(list: ShoppingListSummary): Promise<boolean> { return this.mutate(`restore:${list.id}`, async householdId => { const restored = await firstValueFrom(this.application.restore(householdId, list)); this.listsValue.update(values => [restored, ...values]); this.trashValue.update(values => values.filter(item => item.id !== list.id)); this.stateValue.set(this.trashValue().length ? 'ready' : 'empty'); }); }
  async purge(list: ShoppingListSummary): Promise<boolean> { return this.mutate(`purge:${list.id}`, async householdId => { await firstValueFrom(this.application.purge(householdId, list)); this.trashValue.update(values => values.filter(item => item.id !== list.id)); this.stateValue.set(this.trashValue().length ? 'ready' : 'empty'); }); }
  clearError(): void { this.errorValue.set(null); }

  private async loadDetail(listId: string, conditional: boolean): Promise<void> {
    if (!this.householdId) return;
    const result = await firstValueFrom(this.application.get(this.householdId, listId, conditional ? this.etag : undefined));
    if (result.kind === 'not-modified') return;
    this.detailValue.set(result.detail); this.etag = result.etag ?? undefined; this.stateValue.set('ready');
    this.replaceList(result.detail.list);
  }

  private async reloadAfterMutation(): Promise<void> { this.etag = undefined; const id = this.current()?.id; if (id) await this.loadDetail(id, false); }
  private optimisticStatus(item: ShoppingItem, purchased: boolean): void {
    this.detailValue.update(value => {
      if (!value) return value;
      const next = { ...item, status: purchased ? 'PURCHASED' as const : 'PENDING' as const };
      return purchased
        ? { list: { ...value.list, contentRevision: value.list.contentRevision + 1 }, pending: value.pending.filter(row => row.id !== item.id), purchased: [...value.purchased, next] }
        : { list: { ...value.list, contentRevision: value.list.contentRevision + 1 }, pending: [...value.pending, next], purchased: value.purchased.filter(row => row.id !== item.id) };
    });
  }
  private replaceList(updated: ShoppingListSummary): void { this.listsValue.update(values => values.map(item => item.id === updated.id ? updated : item)); }
  private updateDetailList(updated: ShoppingListSummary): void { this.detailValue.update(value => value ? { ...value, list: updated } : value); }
  private async mutate(operation: string, action: (householdId: string) => Promise<void>, rollback?: ShoppingListDetail): Promise<boolean> {
    if (!this.householdId || this.busyValue()) return false;
    this.busyValue.set(operation); this.errorValue.set(null);
    try { await action(this.householdId); return true; }
    catch (failure) { if (rollback) this.detailValue.set(rollback); const error = this.asError(failure); this.errorValue.set(error); if (error.kind === 'conflict') { try { await this.reloadAfterMutation(); } catch { /* retain recoverable conflict */ } } return false; }
    finally { this.busyValue.set(null); }
  }
  private fail(failure: unknown, state: ShoppingListsLoadState): void { this.errorValue.set(this.asError(failure)); this.stateValue.set(state); }
  private asError(failure: unknown): ShoppingListApplicationError { return failure instanceof ShoppingListApplicationError ? failure : new ShoppingListApplicationError('unexpected', 'Unexpected error'); }
}
