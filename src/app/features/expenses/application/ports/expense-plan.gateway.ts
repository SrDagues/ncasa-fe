import { Observable } from 'rxjs';
import { ExpensePlan, HouseholdRef } from '../../domain';
import { CreateExpensePlanCommand, ExpensePagination, ExpensePlanFilters, ExpensePlanForecast, ExpensePlanPage } from '../expense.models';

export interface ExpensePlanGateway {
  list(householdId: HouseholdRef, filters: ExpensePlanFilters, pagination: ExpensePagination): Observable<ExpensePlanPage>;
  get(householdId: HouseholdRef, planId: string): Observable<ExpensePlan>;
  create(householdId: HouseholdRef, command: CreateExpensePlanCommand): Observable<ExpensePlan>;
  pause(householdId: HouseholdRef, planId: string, version: number, reason?: string): Observable<ExpensePlan>;
  reactivate(householdId: HouseholdRef, planId: string, version: number): Observable<ExpensePlan>;
  cancel(householdId: HouseholdRef, planId: string, version: number, reason: string): Observable<ExpensePlan>;
  forecast(householdId: HouseholdRef, from?: string, to?: string): Observable<ExpensePlanForecast>;
}

export interface TimeZoneGateway { current(): string; list(): readonly string[]; isValid(zoneId: string): boolean; today(zoneId: string): string; }
