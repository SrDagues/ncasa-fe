import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { ShoppingListApplicationError, ShoppingListErrorKind } from '../../application/shopping-list.errors';
import { AddedShoppingItem, ShoppingListCollectionResult, ShoppingListDetailResult, ShoppingListGateway } from '../../application/ports/shopping-list.gateway';
import { CalendarSeriesOption, ShoppingItem, ShoppingItemDraft, ShoppingListSummary } from '../../domain/shopping-list.models';
import { mapCalendarOptions, mapShoppingItem, mapShoppingList, mapShoppingListDetail, mapShoppingLists } from './shopping-list-api.mapper';

export class HttpShoppingListGateway implements ShoppingListGateway {
  constructor(private readonly http: HttpClient, private readonly apiUrl: string) {}

  list(householdId: string, trashed = false, etag?: string): Observable<ShoppingListCollectionResult> {
    const params = trashed ? new HttpParams().set('trashed', true) : undefined;
    const headers = etag ? new HttpHeaders().set('If-None-Match', etag) : undefined;
    return this.http.get<unknown>(this.collection(householdId), { params, headers, observe: 'response' }).pipe(
      map(response => ({ kind: 'loaded', lists: mapShoppingLists(response.body), etag: response.headers.get('ETag') }) as const),
      catchError((failure: unknown) => failure instanceof HttpErrorResponse && failure.status === 304
        ? of({ kind: 'not-modified' } as const)
        : throwError(() => this.normalize(failure))),
    );
  }

  get(householdId: string, listId: string, etag?: string): Observable<ShoppingListDetailResult> {
    const headers = etag ? new HttpHeaders().set('If-None-Match', etag) : undefined;
    return this.http.get<unknown>(`${this.collection(householdId)}/${listId}`, { headers, observe: 'response' }).pipe(
      map(response => ({ kind: 'loaded', detail: mapShoppingListDetail(response.body), etag: response.headers.get('ETag') }) as const),
      catchError((failure: unknown) => failure instanceof HttpErrorResponse && failure.status === 304
        ? of({ kind: 'not-modified' } as const)
        : throwError(() => this.normalize(failure))),
    );
  }

  create(householdId: string, name: string): Observable<ShoppingListSummary> { return this.http.post<unknown>(this.collection(householdId), { name }).pipe(map(mapShoppingList), this.errors()); }
  update(householdId: string, list: ShoppingListSummary, name: string, calendarSeriesId: string | null): Observable<ShoppingListSummary> { return this.http.put<unknown>(`${this.collection(householdId)}/${list.id}`, { version: list.version, name, calendarSeriesId }).pipe(map(mapShoppingList), this.errors()); }
  trash(householdId: string, list: ShoppingListSummary): Observable<ShoppingListSummary> { return this.http.post<unknown>(`${this.collection(householdId)}/${list.id}/trash`, { version: list.version }).pipe(map(mapShoppingList), this.errors()); }
  restore(householdId: string, list: ShoppingListSummary): Observable<ShoppingListSummary> { return this.http.post<unknown>(`${this.collection(householdId)}/${list.id}/restore`, { version: list.version }).pipe(map(mapShoppingList), this.errors()); }
  purge(householdId: string, list: ShoppingListSummary): Observable<void> { return this.http.delete<void>(`${this.collection(householdId)}/${list.id}`, { params: new HttpParams().set('version', list.version) }).pipe(this.errors()); }
  addItem(householdId: string, listId: string, draft: ShoppingItemDraft): Observable<AddedShoppingItem> { return this.http.post<unknown>(`${this.collection(householdId)}/${listId}/items`, this.itemBody(draft)).pipe(map(value => { const body = this.object(value); return { item: mapShoppingItem(body['item']), list: mapShoppingList(body['list']) }; }), this.errors()); }
  updateItem(householdId: string, listId: string, item: ShoppingItem, draft: ShoppingItemDraft): Observable<ShoppingItem> { return this.http.put<unknown>(`${this.collection(householdId)}/${listId}/items/${item.id}`, { version: item.version, item: this.itemBody(draft) }).pipe(map(mapShoppingItem), this.errors()); }
  deleteItem(householdId: string, listId: string, item: ShoppingItem): Observable<void> { return this.http.delete<void>(`${this.collection(householdId)}/${listId}/items/${item.id}`, { params: new HttpParams().set('version', item.version) }).pipe(this.errors()); }
  setPurchased(householdId: string, listId: string, item: ShoppingItem, purchased: boolean): Observable<ShoppingItem> { const action = purchased ? 'purchase' : 'reopen'; return this.http.post<unknown>(`${this.collection(householdId)}/${listId}/items/${item.id}/${action}`, { version: item.version }).pipe(map(mapShoppingItem), this.errors()); }
  reorder(householdId: string, list: ShoppingListSummary, itemIds: readonly string[]): Observable<ShoppingListSummary> { return this.http.put<unknown>(`${this.collection(householdId)}/${list.id}/items/order`, { contentRevision: list.contentRevision, itemIds }).pipe(map(mapShoppingList), this.errors()); }
  clearPurchased(householdId: string, list: ShoppingListSummary): Observable<number> { return this.http.delete<unknown>(`${this.collection(householdId)}/${list.id}/items/purchased`, { params: new HttpParams().set('contentRevision', list.contentRevision) }).pipe(map(value => { const body = typeof value === 'object' && value !== null ? value as Readonly<Record<string, unknown>> : {}; return typeof body['deleted'] === 'number' ? body['deleted'] : 0; }), this.errors()); }
  calendarOptions(householdId: string): Observable<readonly CalendarSeriesOption[]> { return this.http.get<unknown>(`${this.apiUrl}/households/${householdId}/calendar-items/link-options`).pipe(map(mapCalendarOptions), this.errors()); }

  private itemBody(draft: ShoppingItemDraft): object { return { ...draft, name: draft.name.trim(), customUnit: draft.unit === 'OTHER' ? draft.customUnit.trim() : null, note: draft.note.trim() || null }; }
  private object(value: unknown): Readonly<Record<string, unknown>> { if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new ShoppingListApplicationError('unexpected', 'Invalid server response'); return value as Readonly<Record<string, unknown>>; }
  private collection(householdId: string): string { return `${this.apiUrl}/households/${householdId}/shopping-lists`; }
  private errors<T>(): (source: Observable<T>) => Observable<T> { return source => source.pipe(catchError((failure: unknown) => throwError(() => this.normalize(failure)))); }
  private normalize(failure: unknown): ShoppingListApplicationError { if (failure instanceof ShoppingListApplicationError) return failure; if (!(failure instanceof HttpErrorResponse)) return new ShoppingListApplicationError('unexpected', 'Unexpected error'); const kinds: Readonly<Record<number, ShoppingListErrorKind>> = { 0: 'network', 400: 'validation', 401: 'unauthenticated', 403: 'forbidden', 404: 'not-found', 409: 'conflict' }; const body = typeof failure.error === 'object' && failure.error !== null ? failure.error as Readonly<Record<string, unknown>> : {}; const fields = typeof body['fields'] === 'object' && body['fields'] !== null ? body['fields'] as Readonly<Record<string, string>> : {}; return new ShoppingListApplicationError(kinds[failure.status] ?? 'unexpected', typeof body['message'] === 'string' ? body['message'] : failure.message, fields); }
}
