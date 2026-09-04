import { map, Observable, of, switchMap } from 'rxjs';
import { ExpensePlan, HouseholdRef, validateExpensePlanIntent } from '../../domain';
import { CreateExpensePlanCommand, DashboardUpcomingExpense, ExpensePagination, ExpensePlanFilters, ExpensePlanForecast, ExpensePlanPage } from '../expense.models';
import { ExpensePlanGateway, TimeZoneGateway } from '../ports/expense-plan.gateway';

export class ListExpensePlansUseCase { constructor(private readonly gateway: ExpensePlanGateway) {} execute(h: HouseholdRef, f: ExpensePlanFilters, p: ExpensePagination): Observable<ExpensePlanPage> { return this.gateway.list(h, f, p); } }
export class GetExpensePlanUseCase { constructor(private readonly gateway: ExpensePlanGateway) {} execute(h: HouseholdRef, id: string): Observable<ExpensePlan> { return this.gateway.get(h, id); } }
export class CreateExpensePlanUseCase { constructor(private readonly gateway: ExpensePlanGateway, private readonly zones: TimeZoneGateway) {} execute(h: HouseholdRef, command: CreateExpensePlanCommand): Observable<ExpensePlan> { if (!this.zones.isValid(command.zoneId)) throw new Error('Invalid time zone'); validateExpensePlanIntent(command, this.zones.today(command.zoneId)); return this.gateway.create(h, command); } }
export class PauseExpensePlanUseCase { constructor(private readonly gateway: ExpensePlanGateway) {} execute(h: HouseholdRef, id: string, version: number, reason?: string): Observable<ExpensePlan> { const normalized = reason?.trim(); if (normalized && normalized.length > 500) throw new Error('Invalid reason'); return this.gateway.pause(h, id, version, normalized); } }
export class ReactivateExpensePlanUseCase { constructor(private readonly gateway: ExpensePlanGateway) {} execute(h: HouseholdRef, id: string, version: number): Observable<ExpensePlan> { return this.gateway.reactivate(h, id, version); } }
export class CancelExpensePlanUseCase { constructor(private readonly gateway: ExpensePlanGateway) {} execute(h: HouseholdRef, id: string, version: number, reason: string): Observable<ExpensePlan> { const normalized=reason.trim(); if (!normalized || normalized.length>500) throw new Error('Invalid reason'); return this.gateway.cancel(h,id,version,normalized); } }
export class ForecastExpensePlansUseCase { constructor(private readonly gateway: ExpensePlanGateway) {} execute(h: HouseholdRef, from?: string, to?: string): Observable<ExpensePlanForecast> { if (from && to && from > to) throw new Error('Invalid forecast range'); return this.gateway.forecast(h,from,to); } }
export class GetDashboardUpcomingExpenseUseCase {
  constructor(private readonly forecast: ForecastExpensePlansUseCase, private readonly get: GetExpensePlanUseCase) {}
  execute(h: HouseholdRef, from: string, to: string, now: string): Observable<DashboardUpcomingExpense | null> {
    return this.forecast.execute(h,from,to).pipe(switchMap(value => { const occurrence=value.occurrences[0]; if(!occurrence)return of(null); return this.get.execute(h,occurrence.planId).pipe(map(plan=>({planId:occurrence.planId,description:occurrence.description,amount:occurrence.amount,occurrenceDate:occurrence.occurrenceDate,lastOccurrence:occurrence.lastOccurrence,reminderDue:Boolean(plan.nextReminderAt&&plan.nextReminderAt<=now)}))); }));
  }
}
