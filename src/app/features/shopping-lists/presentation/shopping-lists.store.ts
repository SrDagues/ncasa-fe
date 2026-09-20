import { computed, inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  EMPTY,
  exhaustMap,
  filter,
  finalize,
  firstValueFrom,
  fromEvent,
  merge,
  Observable,
  Subject,
  Subscription,
  tap,
  timer,
} from 'rxjs';
import { ShoppingListApplicationError } from '../application/shopping-list.errors';
import {
  LastShoppingListStoragePort,
  ShoppingListCollectionResult,
  ShoppingListDetailResult,
} from '../application/ports/shopping-list.gateway';
import { ShoppingListsApplication } from '../application/shopping-lists.application';
import {
  CalendarSeriesOption,
  ShoppingItem,
  ShoppingItemDraft,
  ShoppingListDetail,
  ShoppingListSummary,
} from '../domain/shopping-list.models';
import { LAST_SHOPPING_LIST_STORAGE } from '../infrastructure/browser/last-shopping-list.storage';

export type ShoppingListsLoadState = 'initial' | 'loading' | 'empty' | 'ready' | 'error';

@Injectable()
export class ShoppingListsStore {
  private readonly application = inject(ShoppingListsApplication);
  private readonly storage = inject<LastShoppingListStoragePort>(LAST_SHOPPING_LIST_STORAGE);
  private readonly stateValue = signal<ShoppingListsLoadState>('initial');
  private readonly trashStateValue = signal<ShoppingListsLoadState>('initial');
  private readonly listsValue = signal<readonly ShoppingListSummary[]>([]);
  private readonly detailValue = signal<ShoppingListDetail | null>(null);
  private readonly trashValue = signal<readonly ShoppingListSummary[]>([]);
  private readonly calendarOptionsValue = signal<readonly CalendarSeriesOption[]>([]);
  private readonly errorValue = signal<ShoppingListApplicationError | null>(null);
  private readonly busyValue = signal<string | null>(null);
  private readonly refreshingValue = signal(false);
  private readonly collectionRefresh = new Subject<void>();
  private householdId: string | null = null;
  private detailEtag: string | undefined;
  private activeCollectionEtag: string | undefined;
  private trashCollectionEtag: string | undefined;
  private contextRevision = 0;
  private polling?: Subscription;

  readonly state = this.stateValue.asReadonly();
  readonly trashState = this.trashStateValue.asReadonly();
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
    const changed = this.householdId !== householdId;
    if (changed) this.beginContext(householdId);
    const revision = this.contextRevision;
    this.stateValue.set('loading');
    this.errorValue.set(null);

    try {
      const result = await firstValueFrom(this.application.list(householdId, false, changed ? undefined : this.activeCollectionEtag));
      if (!this.isCurrent(householdId, revision)) return;
      if (result.kind === 'loaded') this.applyActiveCollection(result);
      await this.refreshCalendarOptions();
      if (!this.isCurrent(householdId, revision)) return;
      await this.reconcileSelection();
    } catch (failure) {
      if (this.isCurrent(householdId, revision)) this.fail(failure, 'error');
    }
  }

  reset(): void {
    const resumePolling = Boolean(this.polling);
    this.polling?.unsubscribe();
    this.polling = undefined;
    this.householdId = null;
    this.contextRevision += 1;
    this.detailEtag = undefined;
    this.activeCollectionEtag = undefined;
    this.trashCollectionEtag = undefined;
    this.listsValue.set([]);
    this.detailValue.set(null);
    this.trashValue.set([]);
    this.calendarOptionsValue.set([]);
    this.errorValue.set(null);
    this.busyValue.set(null);
    this.refreshingValue.set(false);
    this.stateValue.set('initial');
    this.trashStateValue.set('initial');
    if (resumePolling) this.startPolling();
  }

  async select(listId: string): Promise<void> {
    const householdId = this.householdId;
    if (!householdId || this.current()?.id === listId) return;
    const revision = this.contextRevision;
    this.detailEtag = undefined;
    await this.loadDetail(householdId, listId, false, revision);
    if (this.isCurrent(householdId, revision) && this.detailValue()?.list.id === listId) {
      this.storage.write(householdId, listId);
    }
  }

  startPolling(): void {
    this.stopPolling();
    const visibleAgain = fromEvent(document, 'visibilitychange').pipe(
      filter(() => document.visibilityState === 'visible'),
    );
    const whileVisible = filter(() => document.visibilityState === 'visible');

    const detailPolling = merge(timer(15_000, 15_000), visibleAgain).pipe(
      whileVisible,
      exhaustMap(() => this.pollDetail()),
    ).subscribe();
    const collectionPolling = merge(timer(60_000, 60_000), visibleAgain, this.collectionRefresh).pipe(
      whileVisible,
      exhaustMap(() => this.pollCollection()),
    ).subscribe();
    this.polling = new Subscription();
    this.polling.add(detailPolling);
    this.polling.add(collectionPolling);
  }

  stopPolling(): void {
    this.polling?.unsubscribe();
    this.polling = undefined;
    this.refreshingValue.set(false);
  }

  async refresh(): Promise<void> {
    await firstValueFrom(this.pollDetail(), { defaultValue: undefined });
  }

  async refreshCalendarOptions(): Promise<void> {
    const householdId = this.householdId;
    if (!householdId) return;
    const revision = this.contextRevision;
    const options = await firstValueFrom(this.application.calendarOptions(householdId));
    if (this.isCurrent(householdId, revision)) this.calendarOptionsValue.set(options);
  }

  async create(name: string): Promise<boolean> {
    return this.mutate('create', async (householdId, revision) => {
      const created = await firstValueFrom(this.application.create(householdId, name));
      if (!this.isCurrent(householdId, revision)) return;
      this.listsValue.update(values => [created, ...values]);
      this.activeCollectionEtag = undefined;
      this.stateValue.set('ready');
      await this.select(created.id);
    });
  }

  async updateList(name: string, calendarSeriesId: string | null): Promise<boolean> {
    const list = this.current();
    if (!list) return false;
    return this.mutate('settings', async (householdId, revision) => {
      const updated = await firstValueFrom(this.application.update(householdId, list, name, calendarSeriesId));
      if (!this.isCurrent(householdId, revision)) return;
      this.replaceList(updated);
      this.updateDetailList(updated);
      this.detailEtag = undefined;
      this.activeCollectionEtag = undefined;
    });
  }

  async moveCurrentToTrash(): Promise<boolean> {
    const list = this.current();
    if (!list) return false;
    return this.mutate('trash', async (householdId, revision) => {
      await firstValueFrom(this.application.trash(householdId, list));
      if (!this.isCurrent(householdId, revision)) return;
      const remaining = this.listsValue().filter(item => item.id !== list.id);
      this.listsValue.set(remaining);
      this.detailValue.set(null);
      this.detailEtag = undefined;
      this.activeCollectionEtag = undefined;
      this.trashCollectionEtag = undefined;
      this.storage.remove(householdId);
      if (remaining.length) await this.select(remaining[0].id);
      else this.stateValue.set('empty');
    });
  }

  async addItem(draft: ShoppingItemDraft): Promise<boolean> {
    const list = this.current();
    if (!list) return false;
    return this.mutate('add', async (householdId, revision) => {
      const added = await firstValueFrom(this.application.addItem(householdId, list.id, draft));
      if (!this.isCurrent(householdId, revision) || this.current()?.id !== list.id) return;
      this.detailValue.update(value => value
        ? { list: added.list, pending: [...value.pending, added.item], purchased: value.purchased }
        : value);
      this.replaceList(added.list);
      this.detailEtag = undefined;
      this.activeCollectionEtag = undefined;
    });
  }

  async setPurchased(item: ShoppingItem, purchased: boolean): Promise<boolean> {
    const list = this.current();
    const before = this.detailValue();
    if (!list || !before) return false;
    this.optimisticStatus(item, purchased);
    return this.mutate(`status:${item.id}`, async (householdId, revision) => {
      await firstValueFrom(this.application.setPurchased(householdId, list.id, item, purchased));
      if (this.isCurrent(householdId, revision) && this.current()?.id === list.id) await this.reloadAfterMutation();
    }, before);
  }

  async updateItem(item: ShoppingItem, draft: ShoppingItemDraft): Promise<boolean> {
    const list = this.current();
    if (!list) return false;
    return this.mutate(`edit:${item.id}`, async (householdId, revision) => {
      await firstValueFrom(this.application.updateItem(householdId, list.id, item, draft));
      if (this.isCurrent(householdId, revision) && this.current()?.id === list.id) await this.reloadAfterMutation();
    });
  }

  async reorderPending(ids: readonly string[]): Promise<boolean> {
    const list = this.current();
    const before = this.detailValue();
    if (!list || !before) return false;
    const byId = new Map(before.pending.map(item => [item.id, item]));
    this.detailValue.set({
      ...before,
      pending: ids.map(id => byId.get(id)).filter((item): item is ShoppingItem => Boolean(item)),
    });
    return this.mutate('reorder', async (householdId, revision) => {
      const updated = await firstValueFrom(this.application.reorder(householdId, list, ids));
      if (!this.isCurrent(householdId, revision) || this.current()?.id !== list.id) return;
      this.updateDetailList(updated);
      this.replaceList(updated);
      this.detailEtag = undefined;
      this.activeCollectionEtag = undefined;
    }, before);
  }

  async deleteItem(item: ShoppingItem): Promise<boolean> {
    const list = this.current();
    if (!list) return false;
    return this.mutate(`delete:${item.id}`, async (householdId, revision) => {
      await firstValueFrom(this.application.deleteItem(householdId, list.id, item));
      if (this.isCurrent(householdId, revision) && this.current()?.id === list.id) await this.reloadAfterMutation();
    });
  }

  async clearPurchased(): Promise<boolean> {
    const list = this.current();
    if (!list) return false;
    return this.mutate('clear', async (householdId, revision) => {
      await firstValueFrom(this.application.clearPurchased(householdId, list));
      if (this.isCurrent(householdId, revision) && this.current()?.id === list.id) await this.reloadAfterMutation();
    });
  }

  async reusePurchased(): Promise<boolean> {
    const list = this.current();
    if (!list || !this.purchased().length) return false;
    return this.mutate('reuse', async (householdId, revision) => {
      const result = await firstValueFrom(this.application.reusePurchased(householdId, list));
      if (!this.isCurrent(householdId, revision) || this.current()?.id !== list.id) return;
      this.detailValue.set(result.detail);
      this.detailEtag = result.etag ?? undefined;
      this.replaceList(result.detail.list);
      this.activeCollectionEtag = undefined;
    });
  }

  async loadTrash(): Promise<void> {
    const householdId = this.householdId;
    if (!householdId) return;
    const revision = this.contextRevision;
    this.trashStateValue.set('loading');
    this.errorValue.set(null);
    try {
      const result = await firstValueFrom(this.application.list(householdId, true, this.trashCollectionEtag));
      if (!this.isCurrent(householdId, revision)) return;
      if (result.kind === 'loaded') {
        this.trashValue.set(result.lists);
        this.trashCollectionEtag = result.etag ?? undefined;
      }
      this.trashStateValue.set(this.trashValue().length ? 'ready' : 'empty');
    } catch (failure) {
      if (this.isCurrent(householdId, revision)) {
        this.errorValue.set(this.asError(failure));
        this.trashStateValue.set('error');
      }
    }
  }

  async restore(list: ShoppingListSummary): Promise<boolean> {
    return this.mutate(`restore:${list.id}`, async (householdId, revision) => {
      const restored = await firstValueFrom(this.application.restore(householdId, list));
      if (!this.isCurrent(householdId, revision)) return;
      this.listsValue.update(values => [restored, ...values.filter(item => item.id !== restored.id)]);
      this.trashValue.update(values => values.filter(item => item.id !== list.id));
      this.activeCollectionEtag = undefined;
      this.trashCollectionEtag = undefined;
      this.trashStateValue.set(this.trashValue().length ? 'ready' : 'empty');
    });
  }

  async purge(list: ShoppingListSummary): Promise<boolean> {
    return this.mutate(`purge:${list.id}`, async (householdId, revision) => {
      await firstValueFrom(this.application.purge(householdId, list));
      if (!this.isCurrent(householdId, revision)) return;
      this.trashValue.update(values => values.filter(item => item.id !== list.id));
      this.trashCollectionEtag = undefined;
      this.trashStateValue.set(this.trashValue().length ? 'ready' : 'empty');
    });
  }

  clearError(): void { this.errorValue.set(null); }

  private beginContext(householdId: string): void {
    const resumePolling = Boolean(this.polling);
    this.polling?.unsubscribe();
    this.polling = undefined;
    this.householdId = householdId;
    this.contextRevision += 1;
    this.detailEtag = undefined;
    this.activeCollectionEtag = undefined;
    this.trashCollectionEtag = undefined;
    this.listsValue.set([]);
    this.detailValue.set(null);
    this.trashValue.set([]);
    this.calendarOptionsValue.set([]);
    this.trashStateValue.set('initial');
    if (resumePolling) this.startPolling();
  }

  private async reconcileSelection(): Promise<void> {
    const householdId = this.householdId;
    if (!householdId) return;
    const lists = this.listsValue();
    if (!lists.length) {
      this.detailValue.set(null);
      this.detailEtag = undefined;
      this.stateValue.set('empty');
      this.storage.remove(householdId);
      return;
    }
    const currentId = this.current()?.id;
    const selected = lists.find(item => item.id === currentId)
      ?? lists.find(item => item.id === this.storage.read(householdId))
      ?? lists[0];
    if (this.current()?.id === selected.id) {
      this.stateValue.set('ready');
      return;
    }
    await this.select(selected.id);
  }

  private applyActiveCollection(result: Extract<ShoppingListCollectionResult, { kind: 'loaded' }>): void {
    this.listsValue.set(result.lists);
    this.activeCollectionEtag = result.etag ?? undefined;
  }

  private pollDetail(): Observable<unknown> {
    const householdId = this.householdId;
    const listId = this.current()?.id;
    const revision = this.contextRevision;
    if (!householdId || !listId) return EMPTY;
    this.refreshingValue.set(true);
    return this.application.get(householdId, listId, this.detailEtag).pipe(
      tap(result => this.applyPolledDetail(householdId, listId, revision, result)),
      catchError(failure => {
        if (this.isCurrent(householdId, revision)) {
          const error = this.asError(failure);
          if (error.kind === 'not-found') this.collectionRefresh.next();
          else this.errorValue.set(error);
        }
        return EMPTY;
      }),
      finalize(() => {
        if (this.isCurrent(householdId, revision)) this.refreshingValue.set(false);
      }),
    );
  }

  private pollCollection(): Observable<unknown> {
    const householdId = this.householdId;
    const revision = this.contextRevision;
    if (!householdId) return EMPTY;
    return this.application.list(householdId, false, this.activeCollectionEtag).pipe(
      tap(result => {
        if (!this.isCurrent(householdId, revision) || result.kind === 'not-modified') return;
        this.applyActiveCollection(result);
        void this.reconcileSelection().catch(failure => {
          if (this.isCurrent(householdId, revision)) this.errorValue.set(this.asError(failure));
        });
      }),
      catchError(failure => {
        if (this.isCurrent(householdId, revision)) this.errorValue.set(this.asError(failure));
        return EMPTY;
      }),
    );
  }

  private applyPolledDetail(
    householdId: string,
    listId: string,
    revision: number,
    result: ShoppingListDetailResult,
  ): void {
    if (!this.isCurrent(householdId, revision) || this.current()?.id !== listId || result.kind === 'not-modified') return;
    this.detailValue.set(result.detail);
    this.detailEtag = result.etag ?? undefined;
    this.stateValue.set('ready');
    this.replaceList(result.detail.list);
  }

  private async loadDetail(householdId: string, listId: string, conditional: boolean, revision: number): Promise<void> {
    const result = await firstValueFrom(this.application.get(householdId, listId, conditional ? this.detailEtag : undefined));
    if (!this.isCurrent(householdId, revision) || result.kind === 'not-modified') return;
    this.detailValue.set(result.detail);
    this.detailEtag = result.etag ?? undefined;
    this.stateValue.set('ready');
    this.replaceList(result.detail.list);
  }

  private async reloadAfterMutation(): Promise<void> {
    const householdId = this.householdId;
    const id = this.current()?.id;
    if (!householdId || !id) return;
    this.detailEtag = undefined;
    this.activeCollectionEtag = undefined;
    await this.loadDetail(householdId, id, false, this.contextRevision);
  }

  private optimisticStatus(item: ShoppingItem, purchased: boolean): void {
    this.detailValue.update(value => {
      if (!value) return value;
      const next = { ...item, status: purchased ? 'PURCHASED' as const : 'PENDING' as const };
      return purchased
        ? {
            list: { ...value.list, contentRevision: value.list.contentRevision + 1 },
            pending: value.pending.filter(row => row.id !== item.id),
            purchased: [...value.purchased, next],
          }
        : {
            list: { ...value.list, contentRevision: value.list.contentRevision + 1 },
            pending: [...value.pending, next],
            purchased: value.purchased.filter(row => row.id !== item.id),
          };
    });
  }

  private replaceList(updated: ShoppingListSummary): void {
    this.listsValue.update(values => values.map(item => item.id === updated.id ? updated : item));
  }

  private updateDetailList(updated: ShoppingListSummary): void {
    this.detailValue.update(value => value ? { ...value, list: updated } : value);
  }

  private async mutate(
    operation: string,
    action: (householdId: string, revision: number) => Promise<void>,
    rollback?: ShoppingListDetail,
  ): Promise<boolean> {
    const householdId = this.householdId;
    if (!householdId || this.busyValue()) return false;
    const revision = this.contextRevision;
    this.busyValue.set(operation);
    this.errorValue.set(null);
    try {
      await action(householdId, revision);
      return this.isCurrent(householdId, revision);
    } catch (failure) {
      if (!this.isCurrent(householdId, revision)) return false;
      if (rollback) this.detailValue.set(rollback);
      const error = this.asError(failure);
      this.errorValue.set(error);
      if (error.kind === 'conflict') {
        try { await this.reloadAfterMutation(); }
        catch { /* keep the recoverable conflict visible */ }
      }
      return false;
    } finally {
      if (this.isCurrent(householdId, revision)) this.busyValue.set(null);
    }
  }

  private isCurrent(householdId: string, revision: number): boolean {
    return this.householdId === householdId && this.contextRevision === revision;
  }

  private fail(failure: unknown, state: ShoppingListsLoadState): void {
    this.errorValue.set(this.asError(failure));
    this.stateValue.set(state);
  }

  private asError(failure: unknown): ShoppingListApplicationError {
    return failure instanceof ShoppingListApplicationError
      ? failure
      : new ShoppingListApplicationError('unexpected', 'Unexpected error');
  }
}
