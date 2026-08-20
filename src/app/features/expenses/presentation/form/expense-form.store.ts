import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ExpenseApplicationError } from '../../application/expense.errors';
import { CreateExpenseCommand } from '../../application/expense.models';
import { CreateExpenseUseCase } from '../../application/use-cases/expense.use-cases';
import { Expense } from '../../domain';
import { asExpenseError } from '../list/expense-list.store';

@Injectable()
export class ExpenseFormStore {
  private readonly createExpense = inject(CreateExpenseUseCase);
  private readonly pendingValue = signal(false);
  private readonly errorValue = signal<ExpenseApplicationError | null>(null);
  readonly pending = this.pendingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();

  async submit(householdId: string, command: CreateExpenseCommand): Promise<Expense | null> {
    if (this.pendingValue()) return null;
    this.pendingValue.set(true); this.errorValue.set(null);
    try { return await firstValueFrom(this.createExpense.execute(householdId, command)); }
    catch (error) { this.errorValue.set(asExpenseError(error)); return null; }
    finally { this.pendingValue.set(false); }
  }
}
