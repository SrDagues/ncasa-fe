import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ExpenseApplicationError } from '../../application/expense.errors';
import { ExpenseFilters, ExpensePage } from '../../application/expense.models';
import { ListExpensesUseCase } from '../../application/use-cases/expense.use-cases';
import { ListExpenseCategoriesUseCase } from '../../application/use-cases/expense-category.use-cases';
import { ExpenseCategory } from '../../domain';

export type ExpenseListState = 'initial' | 'loading' | 'ready' | 'empty' | 'error';

@Injectable()
export class ExpenseListStore {
  private readonly listExpenses = inject(ListExpensesUseCase);
  private readonly listCategories = inject(ListExpenseCategoriesUseCase);
  private requestId = 0;
  private readonly stateValue = signal<ExpenseListState>('initial');
  private readonly resultValue = signal<ExpensePage | null>(null);
  private readonly errorValue = signal<ExpenseApplicationError | null>(null);
  private readonly categoriesValue = signal<readonly ExpenseCategory[]>([]);
  readonly state = this.stateValue.asReadonly();
  readonly result = this.resultValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly categories = this.categoriesValue.asReadonly();

  async load(householdId: string, filters: ExpenseFilters, page: number): Promise<void> {
    const requestId = ++this.requestId;
    this.stateValue.set('loading'); this.errorValue.set(null);
    try {
      const result = await firstValueFrom(this.listExpenses.execute(householdId, filters, { page, size: 20 }));
      if (requestId !== this.requestId) return;
      this.resultValue.set(result); this.stateValue.set(result.items.length ? 'ready' : 'empty');
    } catch (error) {
      if (requestId !== this.requestId) return;
      this.errorValue.set(asExpenseError(error)); this.stateValue.set('error');
    }
  }
  async loadCategories(householdId: string): Promise<void> { try { this.categoriesValue.set(await firstValueFrom(this.listCategories.execute(householdId, true))); } catch { this.categoriesValue.set([]); } }

  reset(): void { this.requestId++; this.resultValue.set(null); this.categoriesValue.set([]); this.errorValue.set(null); this.stateValue.set('initial'); }
}

export const asExpenseError = (error: unknown): ExpenseApplicationError => error instanceof ExpenseApplicationError
  ? error : new ExpenseApplicationError('unexpected', error instanceof Error ? error.message : 'Unexpected error');
