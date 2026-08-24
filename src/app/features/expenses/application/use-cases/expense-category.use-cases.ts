import { ExpenseCategoryGateway } from '../ports/expense-category.gateway';
import { ExpenseCategoryId, HouseholdRef } from '../../domain';

const normalizeName = (name: string): string => {
  const normalized = name.trim();
  if (!normalized || normalized.length > 80) throw new Error('Category name must contain between 1 and 80 characters');
  return normalized;
};

export class ListExpenseCategoriesUseCase {
  constructor(private readonly gateway: ExpenseCategoryGateway) {}
  execute(householdId: HouseholdRef, includeArchived = false) { return this.gateway.list(householdId, includeArchived); }
}
export class CreateExpenseCategoryUseCase {
  constructor(private readonly gateway: ExpenseCategoryGateway) {}
  execute(householdId: HouseholdRef, name: string) { return this.gateway.create(householdId, normalizeName(name)); }
}
export class RenameExpenseCategoryUseCase {
  constructor(private readonly gateway: ExpenseCategoryGateway) {}
  execute(householdId: HouseholdRef, categoryId: ExpenseCategoryId, name: string) { return this.gateway.rename(householdId, categoryId, normalizeName(name)); }
}
export class ArchiveExpenseCategoryUseCase {
  constructor(private readonly gateway: ExpenseCategoryGateway) {}
  execute(householdId: HouseholdRef, categoryId: ExpenseCategoryId) { return this.gateway.archive(householdId, categoryId); }
}
