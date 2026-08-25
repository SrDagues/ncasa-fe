import { HttpClient } from '@angular/common/http';
import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CreateExpenseUseCase, GetExpenseUseCase, ListExpenseClassificationHistoryUseCase, ListExpensesUseCase, ListRecentExpensesUseCase, ReclassifyExpenseUseCase, VoidExpenseUseCase } from '../application/use-cases/expense.use-cases';
import { HttpExpenseGateway } from './http/http-expense.gateway';
import { HttpFinancialGateway } from './http/http-financial.gateway';
import { CreateSettlementUseCase, GetDashboardFinancialSnapshotUseCase, GetDebtSummaryUseCase, GetMonthlyFinancialSummaryUseCase, GetSettlementUseCase, ListSettlementsUseCase, VoidSettlementUseCase } from '../application/use-cases/financial.use-cases';
import { HttpExpenseCategoryGateway } from './http/http-expense-category.gateway';
import { HttpExpenseDraftGateway } from './http/http-expense-draft.gateway';
import { ArchiveExpenseCategoryUseCase, CreateExpenseCategoryUseCase, ListExpenseCategoriesUseCase, RenameExpenseCategoryUseCase } from '../application/use-cases/expense-category.use-cases';
import { DiscardExpenseDraftUseCase, GetExpenseDraftUseCase, ListExpenseDraftsUseCase, SaveAndConfirmExpenseDraftUseCase, SaveExpenseDraftUseCase } from '../application/use-cases/expense-draft.use-cases';
import { CancelExpensePlanUseCase, CreateExpensePlanUseCase, ForecastExpensePlansUseCase, GetDashboardUpcomingExpenseUseCase, GetExpensePlanUseCase, ListExpensePlansUseCase, PauseExpensePlanUseCase, ReactivateExpensePlanUseCase } from '../application/use-cases/expense-plan.use-cases';
import { HttpExpensePlanGateway } from './http/http-expense-plan.gateway';
import { BrowserTimeZoneGateway } from './browser/browser-time-zone.gateway';

export function provideExpenses(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: HttpExpenseGateway, useFactory: () => new HttpExpenseGateway(inject(HttpClient), environment.apiUrl) },
    { provide: HttpFinancialGateway, useFactory: () => new HttpFinancialGateway(inject(HttpClient), environment.apiUrl) },
    { provide: HttpExpenseCategoryGateway, useFactory: () => new HttpExpenseCategoryGateway(inject(HttpClient), environment.apiUrl) },
    { provide: HttpExpenseDraftGateway, useFactory: () => new HttpExpenseDraftGateway(inject(HttpClient), environment.apiUrl) },
    { provide: HttpExpensePlanGateway, useFactory: () => new HttpExpensePlanGateway(inject(HttpClient), environment.apiUrl) },
    BrowserTimeZoneGateway,
    { provide: ListExpensesUseCase, useFactory: () => new ListExpensesUseCase(inject(HttpExpenseGateway)) },
    { provide: GetExpenseUseCase, useFactory: () => new GetExpenseUseCase(inject(HttpExpenseGateway)) },
    { provide: CreateExpenseUseCase, useFactory: () => new CreateExpenseUseCase(inject(HttpExpenseGateway)) },
    { provide: VoidExpenseUseCase, useFactory: () => new VoidExpenseUseCase(inject(HttpExpenseGateway)) },
    { provide: ReclassifyExpenseUseCase, useFactory: () => new ReclassifyExpenseUseCase(inject(HttpExpenseGateway)) },
    { provide: ListExpenseClassificationHistoryUseCase, useFactory: () => new ListExpenseClassificationHistoryUseCase(inject(HttpExpenseGateway)) },
    { provide: ListExpenseCategoriesUseCase, useFactory: () => new ListExpenseCategoriesUseCase(inject(HttpExpenseCategoryGateway)) },
    { provide: CreateExpenseCategoryUseCase, useFactory: () => new CreateExpenseCategoryUseCase(inject(HttpExpenseCategoryGateway)) },
    { provide: RenameExpenseCategoryUseCase, useFactory: () => new RenameExpenseCategoryUseCase(inject(HttpExpenseCategoryGateway)) },
    { provide: ArchiveExpenseCategoryUseCase, useFactory: () => new ArchiveExpenseCategoryUseCase(inject(HttpExpenseCategoryGateway)) },
    { provide: ListExpenseDraftsUseCase, useFactory: () => new ListExpenseDraftsUseCase(inject(HttpExpenseDraftGateway)) },
    { provide: GetExpenseDraftUseCase, useFactory: () => new GetExpenseDraftUseCase(inject(HttpExpenseDraftGateway)) },
    { provide: DiscardExpenseDraftUseCase, useFactory: () => new DiscardExpenseDraftUseCase(inject(HttpExpenseDraftGateway)) },
    { provide: SaveExpenseDraftUseCase, useFactory: () => new SaveExpenseDraftUseCase(inject(HttpExpenseDraftGateway)) },
    { provide: SaveAndConfirmExpenseDraftUseCase, useFactory: () => new SaveAndConfirmExpenseDraftUseCase(inject(SaveExpenseDraftUseCase), inject(HttpExpenseDraftGateway)) },
    { provide: ListRecentExpensesUseCase, useFactory: () => new ListRecentExpensesUseCase(inject(ListExpensesUseCase)) },
    { provide: GetMonthlyFinancialSummaryUseCase, useFactory: () => new GetMonthlyFinancialSummaryUseCase(inject(HttpFinancialGateway)) },
    { provide: GetDebtSummaryUseCase, useFactory: () => new GetDebtSummaryUseCase(inject(HttpFinancialGateway)) },
    { provide: ListSettlementsUseCase, useFactory: () => new ListSettlementsUseCase(inject(HttpFinancialGateway)) },
    { provide: GetSettlementUseCase, useFactory: () => new GetSettlementUseCase(inject(HttpFinancialGateway)) },
    { provide: CreateSettlementUseCase, useFactory: () => new CreateSettlementUseCase(inject(HttpFinancialGateway)) },
    { provide: VoidSettlementUseCase, useFactory: () => new VoidSettlementUseCase(inject(HttpFinancialGateway)) },
    { provide: GetDashboardFinancialSnapshotUseCase, useFactory: () => new GetDashboardFinancialSnapshotUseCase(inject(GetMonthlyFinancialSummaryUseCase), inject(GetDebtSummaryUseCase)) },
    { provide: ListExpensePlansUseCase, useFactory: () => new ListExpensePlansUseCase(inject(HttpExpensePlanGateway)) },
    { provide: GetExpensePlanUseCase, useFactory: () => new GetExpensePlanUseCase(inject(HttpExpensePlanGateway)) },
    { provide: CreateExpensePlanUseCase, useFactory: () => new CreateExpensePlanUseCase(inject(HttpExpensePlanGateway), inject(BrowserTimeZoneGateway)) },
    { provide: PauseExpensePlanUseCase, useFactory: () => new PauseExpensePlanUseCase(inject(HttpExpensePlanGateway)) },
    { provide: ReactivateExpensePlanUseCase, useFactory: () => new ReactivateExpensePlanUseCase(inject(HttpExpensePlanGateway)) },
    { provide: CancelExpensePlanUseCase, useFactory: () => new CancelExpensePlanUseCase(inject(HttpExpensePlanGateway)) },
    { provide: ForecastExpensePlansUseCase, useFactory: () => new ForecastExpensePlansUseCase(inject(HttpExpensePlanGateway)) },
    { provide: GetDashboardUpcomingExpenseUseCase, useFactory: () => new GetDashboardUpcomingExpenseUseCase(inject(ForecastExpensePlansUseCase), inject(GetExpensePlanUseCase)) },
  ]);
}
