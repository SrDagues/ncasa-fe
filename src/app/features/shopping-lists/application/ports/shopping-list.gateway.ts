import { Observable } from 'rxjs';
import { CalendarSeriesOption, ShoppingItem, ShoppingItemDraft, ShoppingListDetail, ShoppingListSummary } from '../../domain/shopping-list.models';

export type ShoppingListDetailResult =
  | { readonly kind: 'loaded'; readonly detail: ShoppingListDetail; readonly etag: string | null }
  | { readonly kind: 'not-modified' };

export type ShoppingListCollectionResult =
  | { readonly kind: 'loaded'; readonly lists: readonly ShoppingListSummary[]; readonly etag: string | null }
  | { readonly kind: 'not-modified' };

export interface AddedShoppingItem {
  readonly item: ShoppingItem;
  readonly list: ShoppingListSummary;
}

export interface ShoppingListGateway {
  list(householdId: string, trashed?: boolean, etag?: string): Observable<ShoppingListCollectionResult>;
  get(householdId: string, listId: string, etag?: string): Observable<ShoppingListDetailResult>;
  create(householdId: string, name: string): Observable<ShoppingListSummary>;
  update(householdId: string, list: ShoppingListSummary, name: string, calendarSeriesId: string | null): Observable<ShoppingListSummary>;
  trash(householdId: string, list: ShoppingListSummary): Observable<ShoppingListSummary>;
  restore(householdId: string, list: ShoppingListSummary): Observable<ShoppingListSummary>;
  purge(householdId: string, list: ShoppingListSummary): Observable<void>;
  addItem(householdId: string, listId: string, draft: ShoppingItemDraft): Observable<AddedShoppingItem>;
  updateItem(householdId: string, listId: string, item: ShoppingItem, draft: ShoppingItemDraft): Observable<ShoppingItem>;
  deleteItem(householdId: string, listId: string, item: ShoppingItem): Observable<void>;
  setPurchased(householdId: string, listId: string, item: ShoppingItem, purchased: boolean): Observable<ShoppingItem>;
  reorder(householdId: string, list: ShoppingListSummary, itemIds: readonly string[]): Observable<ShoppingListSummary>;
  clearPurchased(householdId: string, list: ShoppingListSummary): Observable<number>;
  calendarOptions(householdId: string): Observable<readonly CalendarSeriesOption[]>;
}

export interface LastShoppingListStoragePort {
  read(householdId: string): string | null;
  write(householdId: string, listId: string): void;
  remove(householdId: string): void;
}
