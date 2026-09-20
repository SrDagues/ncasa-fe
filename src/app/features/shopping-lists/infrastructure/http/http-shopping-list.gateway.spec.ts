import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HttpShoppingListGateway } from './http-shopping-list.gateway';

describe('HttpShoppingListGateway', () => {
  let http: HttpTestingController;
  let gateway: HttpShoppingListGateway;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    gateway = new HttpShoppingListGateway(TestBed.inject(HttpClient), '/api');
  });
  afterEach(() => http.verify());

  it('loads the active collection with its ETag', () => {
    gateway.list('h1').subscribe(result => expect(result).toEqual({ kind: 'loaded', lists: [list], etag: '"collection-1"' }));
    const request = http.expectOne('/api/households/h1/shopping-lists');
    expect(request.request.method).toBe('GET');
    request.flush([list], { headers: { ETag: '"collection-1"' } });
  });

  it('uses the collection ETag and represents a 304', () => {
    gateway.list('h1', false, '"collection-1"').subscribe(result => expect(result).toEqual({ kind: 'not-modified' }));
    const request = http.expectOne('/api/households/h1/shopping-lists');
    expect(request.request.headers.get('If-None-Match')).toBe('"collection-1"');
    request.flush(null, { status: 304, statusText: 'Not Modified' });
  });

  it('loads a detail and retains its ETag for polling', () => {
    gateway.get('h1', 'l1').subscribe(result => expect(result).toMatchObject({ kind: 'loaded', etag: '"2-7"' }));
    const request = http.expectOne('/api/households/h1/shopping-lists/l1');
    request.flush(detail, { headers: { ETag: '"2-7"' } });
  });

  it('sends If-None-Match and represents a 304 without replacing state', () => {
    gateway.get('h1', 'l1', '"2-7"').subscribe(result => expect(result).toEqual({ kind: 'not-modified' }));
    const request = http.expectOne('/api/households/h1/shopping-lists/l1');
    expect(request.request.headers.get('If-None-Match')).toBe('"2-7"');
    request.flush(null, { status: 304, statusText: 'Not Modified' });
  });

  it('serializes optimistic reorder with the complete pending order', () => {
    gateway.reorder('h1', detail.list, ['i2', 'i1']).subscribe();
    const request = http.expectOne('/api/households/h1/shopping-lists/l1/items/order');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ contentRevision: 7, itemIds: ['i2', 'i1'] });
    request.flush(detail.list);
  });

  it('returns the item and exact list revision after adding a product', () => {
    const updatedList = { ...list, contentRevision: 8 };
    gateway.addItem('h1', 'l1', { name: ' Leche ', quantity: 2, unit: 'LITER', customUnit: '', note: '', responsibleMemberId: null })
      .subscribe(result => expect(result).toEqual({ item, list: updatedList }));
    const request = http.expectOne('/api/households/h1/shopping-lists/l1/items');
    expect(request.request.body).toMatchObject({ name: 'Leche', quantity: 2, unit: 'LITER', note: null });
    request.flush({ item, list: updatedList });
  });

  it('reuses purchased products and returns the authoritative detail with its ETag', () => {
    const reused = { list: { ...list, contentRevision: 8 }, pending: [item], purchased: [] };
    gateway.reusePurchased('h1', list).subscribe(result => expect(result).toEqual({ detail: reused, etag: '"2-8"' }));
    const request = http.expectOne('/api/households/h1/shopping-lists/l1/items/reuse-purchased');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ contentRevision: 7 });
    request.flush(reused, { headers: { ETag: '"2-8"' } });
  });
});

const list = { id: 'l1', name: 'Compra semanal', calendarSeriesId: null, status: 'ACTIVE', createdByMemberId: 'm1', createdAt: '2026-09-11T10:00:00Z', updatedAt: '2026-09-11T10:00:00Z', deletedAt: null, version: 2, contentRevision: 7 } as const;
const item = { id: 'i1', listId: 'l1', name: 'Leche', quantity: 2, unit: 'LITER', customUnit: null, note: null, responsibleMemberId: null, addedByMemberId: 'm1', purchasedByMemberId: null, status: 'PENDING', position: 0, createdAt: '2026-09-11T10:00:00Z', updatedAt: '2026-09-11T10:00:00Z', purchasedAt: null, version: 0 } as const;
const detail = { list, pending: [item], purchased: [] };
