import { Routes } from '@angular/router';
import { ExpenseDetailStore } from './presentation/detail/expense-detail.store';
import { ExpenseFormStore } from './presentation/form/expense-form.store';
import { ExpenseListStore } from './presentation/list/expense-list.store';
import { FinancialSummaryStore } from './presentation/financial/financial-summary.store';
import { SettlementDetailStore, SettlementFormStore, SettlementListStore } from './presentation/settlement/settlement.stores';
import { ExpenseCategoryStore } from './presentation/category/expense-category.store';
import { ExpenseDraftListStore } from './presentation/draft/expense-draft-list.store';
import { ExpensePlanDetailStore, ExpensePlanFormStore, ExpensePlansStore } from './presentation/plan/expense-plan.stores';

export const EXPENSE_ROUTES: Routes = [
  { path: 'new', providers: [ExpenseFormStore], loadComponent: () => import('./expense-form/expense-form.component').then(m => m.ExpenseFormComponent),
    data: { titleKey: 'metadata.newExpense' } },
  { path: 'drafts/:draftId', providers: [ExpenseFormStore], loadComponent: () => import('./expense-form/expense-form.component').then(m => m.ExpenseFormComponent), data: { titleKey: 'metadata.expenseDraft', draft: true } },
  { path: 'drafts', providers: [ExpenseDraftListStore], loadComponent: () => import('./presentation/draft/expense-draft-list.component').then(m => m.ExpenseDraftListComponent), data: { titleKey: 'metadata.expenseDrafts' } },
  { path: 'plans/new', providers: [ExpensePlanFormStore], loadComponent: () => import('./presentation/plan/expense-plan-form.component').then(m => m.ExpensePlanFormComponent), data: { titleKey: 'metadata.newExpensePlan' } },
  { path: 'plans/:planId', providers: [ExpensePlanDetailStore], loadComponent: () => import('./presentation/plan/expense-plan-detail.component').then(m => m.ExpensePlanDetailComponent), data: { titleKey: 'metadata.expensePlan' } },
  { path: 'plans', providers: [ExpensePlansStore], loadComponent: () => import('./presentation/plan/expense-plans.component').then(m => m.ExpensePlansComponent), data: { titleKey: 'metadata.expensePlans' } },
  { path: 'categories', providers: [ExpenseCategoryStore], loadComponent: () => import('./presentation/category/expense-category.component').then(m => m.ExpenseCategoryComponent), data: { titleKey: 'metadata.expenseCategories' } },
  { path: 'balances', providers: [FinancialSummaryStore], loadComponent: () => import('./presentation/financial/financial-summary.component').then(m => m.FinancialSummaryComponent), data: { titleKey: 'metadata.balances' } },
  { path: 'settlements/new', providers: [SettlementFormStore], loadComponent: () => import('./presentation/settlement/settlement-form.component').then(m => m.SettlementFormComponent), data: { titleKey: 'metadata.newSettlement' } },
  { path: 'settlements/:settlementId', providers: [SettlementDetailStore], loadComponent: () => import('./presentation/settlement/settlement-detail.component').then(m => m.SettlementDetailComponent), data: { titleKey: 'metadata.settlement' } },
  { path: 'settlements', providers: [SettlementListStore], loadComponent: () => import('./presentation/settlement/settlement-list.component').then(m => m.SettlementListComponent), data: { titleKey: 'metadata.settlements' } },
  { path: ':expenseId', providers: [ExpenseDetailStore], loadComponent: () => import('./presentation/detail/expense-detail.component').then(m => m.ExpenseDetailComponent) },
  { path: '', pathMatch: 'full', providers: [ExpenseListStore], loadComponent: () => import('./expense-list/expense-list.component').then(m => m.ExpenseListComponent) },
];
