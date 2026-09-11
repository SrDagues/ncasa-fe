import { Observable } from 'rxjs';
import { CalendarSeriesOption, ShoppingItem, ShoppingItemDraft, ShoppingListSummary } from '../domain/shopping-list.models';
import { AddedShoppingItem, ShoppingListCollectionResult, ShoppingListDetailResult, ShoppingListGateway } from './ports/shopping-list.gateway';

export class ShoppingListsApplication {
  constructor(private readonly gateway: ShoppingListGateway) {}
  list(householdId: string, trashed = false, etag?: string): Observable<ShoppingListCollectionResult> { return this.gateway.list(householdId, trashed, etag); }
  get(householdId: string, listId: string, etag?: string): Observable<ShoppingListDetailResult> { return this.gateway.get(householdId, listId, etag); }
  create(householdId: string, name: string): Observable<ShoppingListSummary> { return this.gateway.create(householdId, name); }
  update(householdId: string, list: ShoppingListSummary, name: string, calendarSeriesId: string | null): Observable<ShoppingListSummary> { return this.gateway.update(householdId, list, name, calendarSeriesId); }
  trash(householdId: string, list: ShoppingListSummary): Observable<ShoppingListSummary> { return this.gateway.trash(householdId, list); }
  restore(householdId: string, list: ShoppingListSummary): Observable<ShoppingListSummary> { return this.gateway.restore(householdId, list); }
  purge(householdId: string, list: ShoppingListSummary): Observable<void> { return this.gateway.purge(householdId, list); }
  addItem(householdId: string, listId: string, draft: ShoppingItemDraft): Observable<AddedShoppingItem> { return this.gateway.addItem(householdId, listId, draft); }
  updateItem(householdId: string, listId: string, item: ShoppingItem, draft: ShoppingItemDraft): Observable<ShoppingItem> { return this.gateway.updateItem(householdId, listId, item, draft); }
  deleteItem(householdId: string, listId: string, item: ShoppingItem): Observable<void> { return this.gateway.deleteItem(householdId, listId, item); }
  setPurchased(householdId: string, listId: string, item: ShoppingItem, purchased: boolean): Observable<ShoppingItem> { return this.gateway.setPurchased(householdId, listId, item, purchased); }
  reorder(householdId: string, list: ShoppingListSummary, ids: readonly string[]): Observable<ShoppingListSummary> { return this.gateway.reorder(householdId, list, ids); }
  clearPurchased(householdId: string, list: ShoppingListSummary): Observable<number> { return this.gateway.clearPurchased(householdId, list); }
  calendarOptions(householdId: string): Observable<readonly CalendarSeriesOption[]> { return this.gateway.calendarOptions(householdId); }
}
