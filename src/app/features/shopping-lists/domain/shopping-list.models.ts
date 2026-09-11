export type ShoppingListStatus = 'ACTIVE' | 'TRASHED';
export type ShoppingItemStatus = 'PENDING' | 'PURCHASED';
export type ShoppingUnit = 'UNIT' | 'KILOGRAM' | 'GRAM' | 'LITER' | 'MILLILITER' | 'PACKAGE' | 'OTHER';

export interface ShoppingListSummary {
  readonly id: string;
  readonly name: string;
  readonly calendarSeriesId: string | null;
  readonly status: ShoppingListStatus;
  readonly createdByMemberId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
  readonly version: number;
  readonly contentRevision: number;
}

export interface ShoppingItem {
  readonly id: string;
  readonly listId: string;
  readonly name: string;
  readonly quantity: number | null;
  readonly unit: ShoppingUnit | null;
  readonly customUnit: string | null;
  readonly note: string | null;
  readonly responsibleMemberId: string | null;
  readonly addedByMemberId: string;
  readonly purchasedByMemberId: string | null;
  readonly status: ShoppingItemStatus;
  readonly position: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly purchasedAt: string | null;
  readonly version: number;
}

export interface ShoppingListDetail {
  readonly list: ShoppingListSummary;
  readonly pending: readonly ShoppingItem[];
  readonly purchased: readonly ShoppingItem[];
}

export interface ShoppingItemDraft {
  readonly name: string;
  readonly quantity: number | null;
  readonly unit: ShoppingUnit | null;
  readonly customUnit: string;
  readonly note: string;
  readonly responsibleMemberId: string | null;
}

export interface CalendarSeriesOption {
  readonly seriesId: string;
  readonly title: string;
  readonly kind: string;
  readonly startDate: string;
}

export function normalizeShoppingListName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function validateShoppingItemDraft(value: ShoppingItemDraft): readonly (keyof ShoppingItemDraft)[] {
  const invalid: (keyof ShoppingItemDraft)[] = [];
  const name = value.name.trim().replace(/\s+/g, ' ');
  if (!name || name.length > 160) invalid.push('name');
  if (value.quantity !== null && (value.quantity <= 0 || !Number.isFinite(value.quantity) || decimalPlaces(value.quantity) > 3)) invalid.push('quantity');
  if (value.note.trim().length > 500) invalid.push('note');
  if (value.unit === 'OTHER' && (!value.customUnit.trim() || value.customUnit.trim().length > 30)) invalid.push('customUnit');
  if (value.unit !== 'OTHER' && value.customUnit.trim()) invalid.push('customUnit');
  return invalid;
}

function decimalPlaces(value: number): number {
  const text = value.toString().toLowerCase();
  if (text.includes('e-')) return Number(text.split('e-')[1]);
  return text.includes('.') ? text.split('.')[1].length : 0;
}
