import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ExpenseApplicationError } from '../../application/expense.errors';
import { CreateExpensePlanCommand, ExpensePlanFilters, ExpensePlanForecast, ExpensePlanPage } from '../../application/expense.models';
import { CancelExpensePlanUseCase, CreateExpensePlanUseCase, ForecastExpensePlansUseCase, GetExpensePlanUseCase, ListExpensePlansUseCase, PauseExpensePlanUseCase, ReactivateExpensePlanUseCase } from '../../application/use-cases/expense-plan.use-cases';
import { ListExpenseCategoriesUseCase } from '../../application/use-cases/expense-category.use-cases';
import { GetExpenseUseCase } from '../../application/use-cases/expense.use-cases';
import { BrowserTimeZoneGateway } from '../../infrastructure/browser/browser-time-zone.gateway';
import { Expense, ExpenseCategory, ExpensePlan } from '../../domain';
import { asExpenseError } from '../list/expense-list.store';

@Injectable() export class ExpensePlansStore{
 private readonly listCase=inject(ListExpensePlansUseCase);private readonly forecastCase=inject(ForecastExpensePlansUseCase);private listRequest=0;private forecastRequest=0;
 readonly page=signal<ExpensePlanPage|null>(null);readonly forecast=signal<ExpensePlanForecast|null>(null);readonly listState=signal<'initial'|'loading'|'ready'|'empty'|'error'>('initial');readonly forecastState=signal<'initial'|'loading'|'ready'|'empty'|'error'>('initial');readonly listError=signal<ExpenseApplicationError|null>(null);readonly forecastError=signal<ExpenseApplicationError|null>(null);
 async loadList(h:string,f:ExpensePlanFilters,page:number){const request=++this.listRequest;this.listState.set('loading');this.listError.set(null);try{const value=await firstValueFrom(this.listCase.execute(h,f,{page,size:20}));if(request===this.listRequest){this.page.set(value);this.listState.set(value.items.length?'ready':'empty');}}catch(e){if(request===this.listRequest){this.listError.set(asExpenseError(e));this.listState.set('error');}}}
 async loadForecast(h:string,from:string,to:string){const request=++this.forecastRequest;this.forecastState.set('loading');this.forecastError.set(null);try{const value=await firstValueFrom(this.forecastCase.execute(h,from,to));if(request===this.forecastRequest){this.forecast.set(value);this.forecastState.set(value.occurrences.length?'ready':'empty');}}catch(e){if(request===this.forecastRequest){this.forecastError.set(asExpenseError(e));this.forecastState.set('error');}}}
 reset(){this.listRequest++;this.forecastRequest++;this.page.set(null);this.forecast.set(null);this.listState.set('initial');this.forecastState.set('initial');}
}
@Injectable() export class ExpensePlanFormStore{
 private readonly createCase=inject(CreateExpensePlanUseCase);private readonly categoriesCase=inject(ListExpenseCategoriesUseCase);private readonly expenseCase=inject(GetExpenseUseCase);readonly zones=inject(BrowserTimeZoneGateway);readonly pending=signal(false);readonly loading=signal(false);readonly error=signal<ExpenseApplicationError|null>(null);readonly categories=signal<readonly ExpenseCategory[]>([]);readonly sourceExpense=signal<Expense|null>(null);
 async initialize(h:string,sourceId:string|null){this.loading.set(true);this.error.set(null);try{this.categories.set(await firstValueFrom(this.categoriesCase.execute(h,true)));if(sourceId)this.sourceExpense.set(await firstValueFrom(this.expenseCase.execute(h,sourceId)));}catch(e){this.error.set(asExpenseError(e));}finally{this.loading.set(false);}}
 async submit(h:string,c:CreateExpensePlanCommand){if(this.pending())return null;this.pending.set(true);this.error.set(null);try{return await firstValueFrom(this.createCase.execute(h,c));}catch(e){this.error.set(asExpenseError(e));return null;}finally{this.pending.set(false);}}
}
@Injectable() export class ExpensePlanDetailStore{
 private readonly getCase=inject(GetExpensePlanUseCase);private readonly pauseCase=inject(PauseExpensePlanUseCase);private readonly reactivateCase=inject(ReactivateExpensePlanUseCase);private readonly cancelCase=inject(CancelExpensePlanUseCase);private readonly categoriesCase=inject(ListExpenseCategoriesUseCase);readonly state=signal<'loading'|'ready'|'error'>('loading');readonly plan=signal<ExpensePlan|null>(null);readonly categories=signal<readonly ExpenseCategory[]>([]);readonly error=signal<ExpenseApplicationError|null>(null);readonly pending=signal(false);private request=0;
 async load(h:string,id:string){const request=++this.request;this.state.set('loading');this.error.set(null);try{const [plan,categories]=await Promise.all([firstValueFrom(this.getCase.execute(h,id)),firstValueFrom(this.categoriesCase.execute(h,true))]);if(request===this.request){this.plan.set(plan);this.categories.set(categories);this.state.set('ready');}}catch(e){if(request===this.request){this.error.set(asExpenseError(e));this.state.set('error');}}}
 async pause(h:string,reason?:string){return this.action(()=>this.pauseCase.execute(h,this.plan()!.id,this.plan()!.version,reason));}async reactivate(h:string){return this.action(()=>this.reactivateCase.execute(h,this.plan()!.id,this.plan()!.version));}async cancel(h:string,reason:string){return this.action(()=>this.cancelCase.execute(h,this.plan()!.id,this.plan()!.version,reason));}
 private async action(run:()=>ReturnType<GetExpensePlanUseCase['execute']>){if(!this.plan()||this.pending())return false;this.pending.set(true);this.error.set(null);try{this.plan.set(await firstValueFrom(run()));return true;}catch(e){this.error.set(asExpenseError(e));return false;}finally{this.pending.set(false);}}
}
