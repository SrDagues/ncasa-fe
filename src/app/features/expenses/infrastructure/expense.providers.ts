import { HttpClient } from '@angular/common/http';
import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CreateExpenseUseCase, GetExpenseUseCase, ListExpensesUseCase, ListRecentExpensesUseCase, VoidExpenseUseCase } from '../application/use-cases/expense.use-cases';
import { HttpExpenseGateway } from './http/http-expense.gateway';
import { HttpFinancialGateway } from './http/http-financial.gateway';
import { CreateSettlementUseCase, GetDashboardFinancialSnapshotUseCase, GetDebtSummaryUseCase, GetMonthlyFinancialSummaryUseCase, GetSettlementUseCase, ListSettlementsUseCase, VoidSettlementUseCase } from '../application/use-cases/financial.use-cases';

export function provideExpenses(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: HttpExpenseGateway, useFactory: () => new HttpExpenseGateway(inject(HttpClient), environment.apiUrl) },
    { provide: HttpFinancialGateway, useFactory: () => new HttpFinancialGateway(inject(HttpClient), environment.apiUrl) },
    { provide: ListExpensesUseCase, useFactory: () => new ListExpensesUseCase(inject(HttpExpenseGateway)) },
    { provide: GetExpenseUseCase, useFactory: () => new GetExpenseUseCase(inject(HttpExpenseGateway)) },
    { provide: CreateExpenseUseCase, useFactory: () => new CreateExpenseUseCase(inject(HttpExpenseGateway)) },
    { provide: VoidExpenseUseCase, useFactory: () => new VoidExpenseUseCase(inject(HttpExpenseGateway)) },
    { provide: ListRecentExpensesUseCase, useFactory: () => new ListRecentExpensesUseCase(inject(ListExpensesUseCase)) },
    { provide: GetMonthlyFinancialSummaryUseCase, useFactory: () => new GetMonthlyFinancialSummaryUseCase(inject(HttpFinancialGateway)) },
    { provide: GetDebtSummaryUseCase, useFactory: () => new GetDebtSummaryUseCase(inject(HttpFinancialGateway)) },
    { provide: ListSettlementsUseCase, useFactory: () => new ListSettlementsUseCase(inject(HttpFinancialGateway)) },
    { provide: GetSettlementUseCase, useFactory: () => new GetSettlementUseCase(inject(HttpFinancialGateway)) },
    { provide: CreateSettlementUseCase, useFactory: () => new CreateSettlementUseCase(inject(HttpFinancialGateway)) },
    { provide: VoidSettlementUseCase, useFactory: () => new VoidSettlementUseCase(inject(HttpFinancialGateway)) },
    { provide: GetDashboardFinancialSnapshotUseCase, useFactory: () => new GetDashboardFinancialSnapshotUseCase(inject(GetMonthlyFinancialSummaryUseCase), inject(GetDebtSummaryUseCase)) },
  ]);
}
