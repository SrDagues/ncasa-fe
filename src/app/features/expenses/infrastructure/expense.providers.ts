import { HttpClient } from '@angular/common/http';
import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CreateExpenseUseCase, GetExpenseUseCase, ListExpensesUseCase, ListRecentExpensesUseCase, VoidExpenseUseCase } from '../application/use-cases/expense.use-cases';
import { HttpExpenseGateway } from './http/http-expense.gateway';

export function provideExpenses(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: HttpExpenseGateway, useFactory: () => new HttpExpenseGateway(inject(HttpClient), environment.apiUrl) },
    { provide: ListExpensesUseCase, useFactory: () => new ListExpensesUseCase(inject(HttpExpenseGateway)) },
    { provide: GetExpenseUseCase, useFactory: () => new GetExpenseUseCase(inject(HttpExpenseGateway)) },
    { provide: CreateExpenseUseCase, useFactory: () => new CreateExpenseUseCase(inject(HttpExpenseGateway)) },
    { provide: VoidExpenseUseCase, useFactory: () => new VoidExpenseUseCase(inject(HttpExpenseGateway)) },
    { provide: ListRecentExpensesUseCase, useFactory: () => new ListRecentExpensesUseCase(inject(ListExpensesUseCase)) },
  ]);
}
