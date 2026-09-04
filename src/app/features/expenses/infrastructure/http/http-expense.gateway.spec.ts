import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ExpenseApplicationError } from '../../application/expense.errors';
import { Money } from '../../domain';
import { HttpExpenseGateway } from './http-expense.gateway';

const response = { id: 'e1', householdId: 'h1', createdByMemberId: 'm1', payerMemberId: 'm1', amount: '10.00',
  currency: 'EUR', description: 'Compra', expenseDate: '2026-08-20', splitType: 'EQUAL',
  allocations: [{ memberId: 'm1', amount: '10.00' }], status: 'CONFIRMED', source: 'MANUAL', voidReason: null,
  createdAt: '2026-08-20T10:00:00Z', updatedAt: '2026-08-20T10:00:00Z', voidedAt: null, version: 0 };

describe('HttpExpenseGateway', () => {
  let http: HttpTestingController;
  let gateway: HttpExpenseGateway;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    gateway = new HttpExpenseGateway(TestBed.inject(HttpClient), '/api');
  });
  afterEach(() => http.verify());

  it('lists with explicit filters and maps decimal strings', async () => {
    const result = firstValueFrom(gateway.list('h1', { status: 'VOIDED', from: '2026-08-01' }, { page: 1, size: 20 }));
    const request = http.expectOne(req => req.url === '/api/households/h1/expenses');
    expect(request.request.params.get('status')).toBe('VOIDED');
    expect(request.request.params.get('from')).toBe('2026-08-01');
    expect(request.request.params.has('to')).toBe(false);
    request.flush({ items: [response], page: 1, size: 20, totalElements: 21, totalPages: 2 });
    expect((await result).items[0].amount.toDecimal()).toBe('10.00');
  });

  it('serializes only the exact allocation branch', async () => {
    const result = firstValueFrom(gateway.create('h1', { description: 'Compra', amount: Money.fromDecimal('10', 'EUR'),
      expenseDate: '2026-08-20', payerMemberId: 'm1', split: { type: 'EXACT', allocations: [
        { memberId: 'm1', amount: Money.fromDecimal('10', 'EUR') },
      ] } }));
    const request = http.expectOne('/api/households/h1/expenses');
    expect(request.request.body.split).toEqual({ type: 'EXACT', allocations: [{ memberId: 'm1', amount: '10.00' }] });
    expect(request.request.body.split.memberIds).toBeUndefined();
    request.flush(response);
    await result;
  });

  it('normalizes backend failures', async () => {
    const result = firstValueFrom(gateway.void('h1', 'e1', 'Duplicado'));
    http.expectOne('/api/households/h1/expenses/e1/void').flush({ message: 'Already voided', fields: {} },
      { status: 409, statusText: 'Conflict' });
    await expect(result).rejects.toEqual(expect.objectContaining<Partial<ExpenseApplicationError>>({ kind: 'conflict' }));
  });
});
