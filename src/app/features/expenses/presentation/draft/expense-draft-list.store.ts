import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ExpenseApplicationError } from '../../application/expense.errors';
import { DiscardExpenseDraftUseCase, ListExpenseDraftsUseCase } from '../../application/use-cases/expense-draft.use-cases';
import { ExpenseDraft } from '../../domain';
import { asExpenseError } from '../list/expense-list.store';
@Injectable() export class ExpenseDraftListStore {
  private readonly listDrafts=inject(ListExpenseDraftsUseCase);private readonly discardDraft=inject(DiscardExpenseDraftUseCase);private requestId=0;
  private readonly stateValue=signal<'initial'|'loading'|'ready'|'empty'|'error'>('initial');private readonly draftsValue=signal<readonly ExpenseDraft[]>([]);private readonly errorValue=signal<ExpenseApplicationError|null>(null);private readonly pendingValue=signal(false);
  readonly state=this.stateValue.asReadonly();readonly drafts=this.draftsValue.asReadonly();readonly error=this.errorValue.asReadonly();readonly pending=this.pendingValue.asReadonly();
  async load(householdId:string){const requestId=++this.requestId;this.stateValue.set('loading');this.errorValue.set(null);try{const result=await firstValueFrom(this.listDrafts.execute(householdId));if(requestId===this.requestId){this.draftsValue.set(result);this.stateValue.set(result.length?'ready':'empty');}}catch(error){if(requestId===this.requestId){this.errorValue.set(asExpenseError(error));this.stateValue.set('error');}}}
  async discard(householdId:string,draft:ExpenseDraft){if(this.pendingValue())return false;this.pendingValue.set(true);try{await firstValueFrom(this.discardDraft.execute(householdId,draft.id,draft.version));this.draftsValue.update(items=>items.filter(item=>item.id!==draft.id));this.stateValue.set(this.draftsValue().length?'ready':'empty');return true;}catch(error){this.errorValue.set(asExpenseError(error));if(this.errorValue()?.kind==='conflict')await this.load(householdId);return false;}finally{this.pendingValue.set(false);}}
  reset(){this.requestId++;this.draftsValue.set([]);this.errorValue.set(null);this.stateValue.set('initial');}
}
