import { Routes } from '@angular/router';
import { ExpenseDetailStore } from './presentation/detail/expense-detail.store';
import { ExpenseFormStore } from './presentation/form/expense-form.store';
import { ExpenseListStore } from './presentation/list/expense-list.store';

export const EXPENSE_ROUTES: Routes = [
  { path: 'new', providers: [ExpenseFormStore], loadComponent: () => import('./expense-form/expense-form.component').then(m => m.ExpenseFormComponent),
    data: { titleKey: 'metadata.newExpense' } },
  { path: ':expenseId', providers: [ExpenseDetailStore], loadComponent: () => import('./presentation/detail/expense-detail.component').then(m => m.ExpenseDetailComponent) },
  { path: '', pathMatch: 'full', providers: [ExpenseListStore], loadComponent: () => import('./expense-list/expense-list.component').then(m => m.ExpenseListComponent) },
];
