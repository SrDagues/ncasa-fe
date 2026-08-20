import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { ExpensePage } from '../../application/expense.models';
import { ListExpensesUseCase } from '../../application/use-cases/expense.use-cases';
import { ExpenseListStore } from './expense-list.store';

describe('ExpenseListStore', () => {
  let responses: Subject<ExpensePage>[];
  beforeEach(() => {
    responses = [];
    TestBed.configureTestingModule({ providers: [ExpenseListStore, { provide: ListExpensesUseCase, useValue: {
      execute: () => { const response = new Subject<ExpensePage>(); responses.push(response); return response; },
    } }] });
  });

  it('ignores a stale response after household or filters change', async () => {
    const store = TestBed.inject(ExpenseListStore);
    const first = store.load('h1', { status: 'CONFIRMED' }, 0);
    const second = store.load('h2', { status: 'VOIDED' }, 0);
    responses[1].next({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }); responses[1].complete();
    await second;
    responses[0].next({ items: [], page: 0, size: 20, totalElements: 5, totalPages: 1 }); responses[0].complete();
    await first;
    expect(store.result()?.totalElements).toBe(0);
    expect(store.state()).toBe('empty');
  });
});
