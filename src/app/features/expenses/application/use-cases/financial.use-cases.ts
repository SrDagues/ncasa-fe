import { forkJoin, map, Observable } from 'rxjs';
import { HouseholdRef, MemberRef, Settlement, SettlementId } from '../../domain';
import { CreateSettlementCommand, DashboardFinancialSnapshot, DebtSummary, ExpensePagination, MonthlyFinancialSummary, SettlementFilters, SettlementPage } from '../expense.models';
import { FinancialGateway, SettlementGateway } from '../ports/financial.gateway';
export class GetMonthlyFinancialSummaryUseCase { constructor(private readonly gateway: FinancialGateway) {} execute(householdId: HouseholdRef, month: string): Observable<MonthlyFinancialSummary> { if (!/^\d{4}-\d{2}$/.test(month)) throw new Error('Invalid month'); return this.gateway.getMonthly(householdId, month); } }
export class GetDebtSummaryUseCase { constructor(private readonly gateway: FinancialGateway) {} execute(householdId: HouseholdRef): Observable<DebtSummary> { return this.gateway.getDebt(householdId); } }
export class ListSettlementsUseCase { constructor(private readonly gateway: SettlementGateway) {} execute(householdId: HouseholdRef, filters: SettlementFilters, pagination: ExpensePagination): Observable<SettlementPage> { if (pagination.page < 0 || pagination.size < 1 || pagination.size > 100 || (filters.from && filters.to && filters.from > filters.to)) throw new Error('Invalid settlement query'); return this.gateway.list(householdId, filters, pagination); } }
export class GetSettlementUseCase { constructor(private readonly gateway: SettlementGateway) {} execute(householdId: HouseholdRef, id: SettlementId): Observable<Settlement> { return this.gateway.get(householdId, id); } }
export class CreateSettlementUseCase { constructor(private readonly gateway: SettlementGateway) {} execute(householdId: HouseholdRef, command: CreateSettlementCommand): Observable<Settlement> { return this.gateway.create(householdId, { ...command, note: command.note?.trim() || undefined }); } }
export class VoidSettlementUseCase { constructor(private readonly gateway: SettlementGateway) {} execute(householdId: HouseholdRef, id: SettlementId, reason: string): Observable<Settlement> { return this.gateway.void(householdId, id, reason.trim()); } }
export class GetDashboardFinancialSnapshotUseCase {
  constructor(private readonly monthly: GetMonthlyFinancialSummaryUseCase, private readonly debt: GetDebtSummaryUseCase) {}
  execute(householdId: HouseholdRef, memberId: MemberRef, month: string): Observable<DashboardFinancialSnapshot> {
    return forkJoin({ monthly: this.monthly.execute(householdId, month), debt: this.debt.execute(householdId) }).pipe(map(({ monthly, debt }) => ({
      monthly: monthly.currencies.map(item => ({ currency: item.currency, totalExpenses: item.totalExpenses })),
      personal: debt.currencies.map(item => ({ currency: item.currency, net: item.members.find(member => member.memberId === memberId)?.net ?? item.members[0]?.net.subtract(item.members[0].net) })).filter((item): item is { currency: string; net: NonNullable<typeof item.net> } => item.net !== undefined),
    })));
  }
}
