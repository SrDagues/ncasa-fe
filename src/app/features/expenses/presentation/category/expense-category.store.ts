import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ExpenseApplicationError } from '../../application/expense.errors';
import { ArchiveExpenseCategoryUseCase, CreateExpenseCategoryUseCase, ListExpenseCategoriesUseCase, RenameExpenseCategoryUseCase } from '../../application/use-cases/expense-category.use-cases';
import { ExpenseCategory } from '../../domain';
import { asExpenseError } from '../list/expense-list.store';

@Injectable()
export class ExpenseCategoryStore {
  private readonly listCategories = inject(ListExpenseCategoriesUseCase);
  private readonly createCategory = inject(CreateExpenseCategoryUseCase);
  private readonly renameCategory = inject(RenameExpenseCategoryUseCase);
  private readonly archiveCategory = inject(ArchiveExpenseCategoryUseCase);
  private requestId = 0;
  private readonly stateValue = signal<'initial' | 'loading' | 'ready' | 'error'>('initial');
  private readonly categoriesValue = signal<readonly ExpenseCategory[]>([]);
  private readonly errorValue = signal<ExpenseApplicationError | null>(null);
  private readonly pendingValue = signal(false);
  readonly state = this.stateValue.asReadonly(); readonly categories = this.categoriesValue.asReadonly();
  readonly error = this.errorValue.asReadonly(); readonly pending = this.pendingValue.asReadonly();

  async load(householdId: string): Promise<void> {
    const requestId = ++this.requestId; this.stateValue.set('loading'); this.errorValue.set(null);
    try { const result = await firstValueFrom(this.listCategories.execute(householdId, true)); if (requestId === this.requestId) { this.categoriesValue.set(result); this.stateValue.set('ready'); } }
    catch (error) { if (requestId === this.requestId) { this.errorValue.set(asExpenseError(error)); this.stateValue.set('error'); } }
  }
  async create(householdId: string, name: string): Promise<boolean> { return this.mutate(() => this.createCategory.execute(householdId, name)); }
  async rename(householdId: string, id: string, name: string): Promise<boolean> { return this.mutate(() => this.renameCategory.execute(householdId, id, name)); }
  async archive(householdId: string, id: string): Promise<boolean> { return this.mutate(() => this.archiveCategory.execute(householdId, id)); }
  reset(): void { this.requestId++; this.categoriesValue.set([]); this.errorValue.set(null); this.stateValue.set('initial'); }
  private async mutate(action: () => ReturnType<CreateExpenseCategoryUseCase['execute']>): Promise<boolean> {
    if (this.pendingValue()) return false; this.pendingValue.set(true); this.errorValue.set(null);
    try { const updated = await firstValueFrom(action()); this.categoriesValue.update(items => [...items.filter(item => item.id !== updated.id), updated].sort((a, b) => a.name.localeCompare(b.name))); return true; }
    catch (error) { this.errorValue.set(asExpenseError(error)); return false; } finally { this.pendingValue.set(false); }
  }
}
