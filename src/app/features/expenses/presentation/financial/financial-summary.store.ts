import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import { DebtSummary, MonthlyFinancialSummary } from '../../application/expense.models';
import { GetDebtSummaryUseCase, GetMonthlyFinancialSummaryUseCase } from '../../application/use-cases/financial.use-cases';
import { ExpenseApplicationError } from '../../application/expense.errors';
import { asExpenseError } from '../list/expense-list.store';
@Injectable()
export class FinancialSummaryStore {
  private readonly monthlyUseCase = inject(GetMonthlyFinancialSummaryUseCase); private readonly debtUseCase = inject(GetDebtSummaryUseCase); private requestId = 0;
  private readonly stateValue = signal<'initial'|'loading'|'ready'|'empty'|'error'>('initial'); private readonly monthlyValue = signal<MonthlyFinancialSummary|null>(null); private readonly debtValue = signal<DebtSummary|null>(null); private readonly errorValue = signal<ExpenseApplicationError|null>(null);
  readonly state=this.stateValue.asReadonly(); readonly monthly=this.monthlyValue.asReadonly(); readonly debt=this.debtValue.asReadonly(); readonly error=this.errorValue.asReadonly();
  async load(householdId:string,month:string):Promise<void>{const request=++this.requestId;this.stateValue.set('loading');this.errorValue.set(null);try{const result=await firstValueFrom(forkJoin({monthly:this.monthlyUseCase.execute(householdId,month),debt:this.debtUseCase.execute(householdId)}));if(request!==this.requestId)return;this.monthlyValue.set(result.monthly);this.debtValue.set(result.debt);this.stateValue.set(result.monthly.currencies.length||result.debt.currencies.length?'ready':'empty');}catch(error){if(request===this.requestId){this.errorValue.set(asExpenseError(error));this.stateValue.set('error');}}}
  reset():void{this.requestId++;this.monthlyValue.set(null);this.debtValue.set(null);this.errorValue.set(null);this.stateValue.set('initial');}
}
