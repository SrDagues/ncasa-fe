import { Observable } from 'rxjs';
import { HouseholdRef, Settlement, SettlementId } from '../../domain';
import { CreateSettlementCommand, DebtSummary, ExpensePagination, MonthlyFinancialSummary, SettlementFilters, SettlementPage } from '../expense.models';
export interface FinancialGateway { getMonthly(householdId: HouseholdRef, month: string): Observable<MonthlyFinancialSummary>; getDebt(householdId: HouseholdRef): Observable<DebtSummary>; }
export interface SettlementGateway {
  list(householdId: HouseholdRef, filters: SettlementFilters, pagination: ExpensePagination): Observable<SettlementPage>;
  get(householdId: HouseholdRef, id: SettlementId): Observable<Settlement>;
  create(householdId: HouseholdRef, command: CreateSettlementCommand): Observable<Settlement>;
  void(householdId: HouseholdRef, id: SettlementId, reason: string): Observable<Settlement>;
}
