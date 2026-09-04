import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ExpenseApplicationError } from '../../application/expense.errors';
import { CreateExpenseCommand } from '../../application/expense.models';
import { ExpenseDraftSnapshot, SaveExpenseDraftCommand } from '../../application/expense.models';
import { ListExpenseCategoriesUseCase } from '../../application/use-cases/expense-category.use-cases';
import { DiscardExpenseDraftUseCase, DraftSaveError, GetExpenseDraftUseCase, SaveAndConfirmExpenseDraftUseCase, SaveExpenseDraftUseCase } from '../../application/use-cases/expense-draft.use-cases';
import { CreateExpenseUseCase } from '../../application/use-cases/expense.use-cases';
import { Expense, ExpenseCategory, ExpenseDraft } from '../../domain';
import { asExpenseError } from '../list/expense-list.store';

@Injectable()
export class ExpenseFormStore {
  private readonly createExpense = inject(CreateExpenseUseCase);
  private readonly listCategories = inject(ListExpenseCategoriesUseCase);
  private readonly getDraft = inject(GetExpenseDraftUseCase);
  private readonly saveDraftUseCase = inject(SaveExpenseDraftUseCase);
  private readonly confirmDraftUseCase = inject(SaveAndConfirmExpenseDraftUseCase);
  private readonly discardDraftUseCase = inject(DiscardExpenseDraftUseCase);
  private readonly pendingValue = signal(false);
  private readonly errorValue = signal<ExpenseApplicationError | null>(null);
  private readonly draftValue = signal<ExpenseDraft | null>(null);
  private readonly categoriesValue = signal<readonly ExpenseCategory[]>([]);
  private readonly loadingValue = signal(false);
  private readonly conflictValue = signal(false);
  readonly pending = this.pendingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly draft = this.draftValue.asReadonly(); readonly categories = this.categoriesValue.asReadonly();
  readonly loading = this.loadingValue.asReadonly(); readonly conflict = this.conflictValue.asReadonly();

  async submit(householdId: string, command: CreateExpenseCommand): Promise<Expense | null> {
    if (this.pendingValue()) return null;
    this.pendingValue.set(true); this.errorValue.set(null);
    try { return await firstValueFrom(this.createExpense.execute(householdId, command)); }
    catch (error) { this.errorValue.set(asExpenseError(error)); return null; }
    finally { this.pendingValue.set(false); }
  }

  async loadCategories(householdId: string): Promise<void> {
    try { this.categoriesValue.set(await firstValueFrom(this.listCategories.execute(householdId, true))); }
    catch (error) { this.errorValue.set(asExpenseError(error)); }
  }
  async loadDraft(householdId: string, draftId: string): Promise<ExpenseDraft | null> {
    this.loadingValue.set(true); this.errorValue.set(null); this.conflictValue.set(false);
    try { const draft = await firstValueFrom(this.getDraft.execute(householdId, draftId)); this.draftValue.set(draft); return draft; }
    catch (error) { this.errorValue.set(asExpenseError(error)); return null; } finally { this.loadingValue.set(false); }
  }
  async saveDraft(householdId: string, snapshot: ExpenseDraftSnapshot): Promise<ExpenseDraft | null> {
    if (this.pendingValue()) return null; this.pendingValue.set(true); this.errorValue.set(null); this.conflictValue.set(false);
    const current = this.draftValue();
    try { const draft = await firstValueFrom(this.saveDraftUseCase.execute({ householdId, draftId: current?.id, version: current?.version, snapshot })); this.draftValue.set(draft); return draft; }
    catch (error) { if (error instanceof DraftSaveError) this.draftValue.set(error.recoverableDraft); const failure=asExpenseError(error);this.errorValue.set(failure);this.conflictValue.set(failure.kind==='conflict');return null; }
    finally { this.pendingValue.set(false); }
  }
  async confirmDraft(householdId: string, snapshot: ExpenseDraftSnapshot): Promise<Expense | null> {
    if (this.pendingValue()) return null; this.pendingValue.set(true); this.errorValue.set(null); this.conflictValue.set(false); const current=this.draftValue();
    try { return await firstValueFrom(this.confirmDraftUseCase.execute({householdId,draftId:current?.id,version:current?.version,snapshot})); }
    catch(error){if(error instanceof DraftSaveError)this.draftValue.set(error.recoverableDraft);const failure=asExpenseError(error);this.errorValue.set(failure);this.conflictValue.set(failure.kind==='conflict');return null;}finally{this.pendingValue.set(false);}
  }
  async discardDraft(householdId:string):Promise<boolean>{const current=this.draftValue();if(!current||this.pendingValue())return false;this.pendingValue.set(true);this.errorValue.set(null);try{this.draftValue.set(await firstValueFrom(this.discardDraftUseCase.execute(householdId,current.id,current.version)));return true;}catch(error){const failure=asExpenseError(error);this.errorValue.set(failure);this.conflictValue.set(failure.kind==='conflict');return false;}finally{this.pendingValue.set(false);}}
}
