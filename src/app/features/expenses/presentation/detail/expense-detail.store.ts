import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ExpenseApplicationError } from '../../application/expense.errors';
import { GetExpenseUseCase, ListExpenseClassificationHistoryUseCase, ReclassifyExpenseUseCase, VoidExpenseUseCase } from '../../application/use-cases/expense.use-cases';
import { ListExpenseCategoriesUseCase } from '../../application/use-cases/expense-category.use-cases';
import { Expense, ExpenseCategory, ExpenseClassificationChange } from '../../domain';
import { asExpenseError } from '../list/expense-list.store';

export type ExpenseDetailState = 'loading' | 'ready' | 'error';

@Injectable()
export class ExpenseDetailStore {
  private readonly getExpense = inject(GetExpenseUseCase);
  private readonly voidExpense = inject(VoidExpenseUseCase);
  private readonly reclassifyExpense = inject(ReclassifyExpenseUseCase); private readonly listHistory=inject(ListExpenseClassificationHistoryUseCase);private readonly listCategories=inject(ListExpenseCategoriesUseCase);
  private requestId = 0;
  private readonly stateValue = signal<ExpenseDetailState>('loading');
  private readonly expenseValue = signal<Expense | null>(null);
  private readonly errorValue = signal<ExpenseApplicationError | null>(null);
  private readonly pendingValue = signal(false);
  private readonly categoriesValue=signal<readonly ExpenseCategory[]>([]);private readonly historyValue=signal<readonly ExpenseClassificationChange[]>([]);private readonly historyErrorValue=signal<ExpenseApplicationError|null>(null);
  readonly state = this.stateValue.asReadonly();
  readonly expense = this.expenseValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly pending = this.pendingValue.asReadonly();
  readonly categories=this.categoriesValue.asReadonly();readonly history=this.historyValue.asReadonly();readonly historyError=this.historyErrorValue.asReadonly();

  async load(householdId: string, expenseId: string): Promise<void> {
    const requestId = ++this.requestId; this.stateValue.set('loading'); this.errorValue.set(null);
    try { const [expense,categories] = await Promise.all([firstValueFrom(this.getExpense.execute(householdId, expenseId)),firstValueFrom(this.listCategories.execute(householdId,true)).catch(()=>[])]);
      if (requestId === this.requestId) { this.expenseValue.set(expense);this.categoriesValue.set(categories); this.stateValue.set('ready');void this.loadHistory(householdId,expenseId); }
    } catch (error) { if (requestId === this.requestId) { this.errorValue.set(asExpenseError(error)); this.stateValue.set('error'); } }
  }
  async loadHistory(householdId:string,expenseId:string):Promise<void>{this.historyErrorValue.set(null);try{this.historyValue.set(await firstValueFrom(this.listHistory.execute(householdId,expenseId)));}catch(error){this.historyErrorValue.set(asExpenseError(error));}}
  async reclassify(householdId:string,expenseId:string,categoryId:string|null,reason:string):Promise<boolean>{if(this.pendingValue())return false;this.pendingValue.set(true);this.errorValue.set(null);try{this.expenseValue.set(await firstValueFrom(this.reclassifyExpense.execute(householdId,expenseId,{categoryId,reason})));await this.loadHistory(householdId,expenseId);return true;}catch(error){const failure=asExpenseError(error);this.errorValue.set(failure);if(failure.kind==='conflict')await this.load(householdId,expenseId);return false;}finally{this.pendingValue.set(false);}}

  async void(householdId: string, expenseId: string, reason: string): Promise<boolean> {
    if (this.pendingValue()) return false;
    this.pendingValue.set(true); this.errorValue.set(null);
    try { this.expenseValue.set(await firstValueFrom(this.voidExpense.execute(householdId, expenseId, reason))); return true; }
    catch (error) {
      const failure = asExpenseError(error); this.errorValue.set(failure);
      if (failure.kind === 'conflict') await this.load(householdId, expenseId);
      return false;
    } finally { this.pendingValue.set(false); }
  }
}
