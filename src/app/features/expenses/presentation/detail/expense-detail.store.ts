import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ExpenseApplicationError } from '../../application/expense.errors';
import { GetExpenseUseCase, VoidExpenseUseCase } from '../../application/use-cases/expense.use-cases';
import { Expense } from '../../domain';
import { asExpenseError } from '../list/expense-list.store';

export type ExpenseDetailState = 'loading' | 'ready' | 'error';

@Injectable()
export class ExpenseDetailStore {
  private readonly getExpense = inject(GetExpenseUseCase);
  private readonly voidExpense = inject(VoidExpenseUseCase);
  private requestId = 0;
  private readonly stateValue = signal<ExpenseDetailState>('loading');
  private readonly expenseValue = signal<Expense | null>(null);
  private readonly errorValue = signal<ExpenseApplicationError | null>(null);
  private readonly pendingValue = signal(false);
  readonly state = this.stateValue.asReadonly();
  readonly expense = this.expenseValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly pending = this.pendingValue.asReadonly();

  async load(householdId: string, expenseId: string): Promise<void> {
    const requestId = ++this.requestId; this.stateValue.set('loading'); this.errorValue.set(null);
    try { const expense = await firstValueFrom(this.getExpense.execute(householdId, expenseId));
      if (requestId === this.requestId) { this.expenseValue.set(expense); this.stateValue.set('ready'); }
    } catch (error) { if (requestId === this.requestId) { this.errorValue.set(asExpenseError(error)); this.stateValue.set('error'); } }
  }

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
