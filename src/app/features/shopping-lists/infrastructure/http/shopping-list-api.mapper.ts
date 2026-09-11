import { CalendarSeriesOption, ShoppingItem, ShoppingListDetail, ShoppingListSummary } from '../../domain/shopping-list.models';
import { ShoppingListApplicationError } from '../../application/shopping-list.errors';

type Json = Readonly<Record<string, unknown>>;

export function mapShoppingLists(value: unknown): readonly ShoppingListSummary[] {
  if (!Array.isArray(value)) invalid();
  return value.map(mapShoppingList);
}

export function mapShoppingList(value: unknown): ShoppingListSummary {
  const dto = object(value);
  return {
    id: string(dto, 'id'), name: string(dto, 'name'), calendarSeriesId: nullableString(dto, 'calendarSeriesId'),
    status: oneOf(dto, 'status', ['ACTIVE', 'TRASHED']), createdByMemberId: string(dto, 'createdByMemberId'),
    createdAt: string(dto, 'createdAt'), updatedAt: string(dto, 'updatedAt'), deletedAt: nullableString(dto, 'deletedAt'),
    version: number(dto, 'version'), contentRevision: number(dto, 'contentRevision'),
  } satisfies ShoppingListSummary;
}

export function mapShoppingListDetail(value: unknown): ShoppingListDetail {
  const dto = object(value);
  return { list: mapShoppingList(dto['list']), pending: items(dto['pending']), purchased: items(dto['purchased']) };
}

export function mapShoppingItem(value: unknown): ShoppingItem {
  const dto = object(value);
  return {
    id: string(dto, 'id'), listId: string(dto, 'listId'), name: string(dto, 'name'), quantity: nullableNumber(dto, 'quantity'),
    unit: nullableOneOf(dto, 'unit', ['UNIT', 'KILOGRAM', 'GRAM', 'LITER', 'MILLILITER', 'PACKAGE', 'OTHER']),
    customUnit: nullableString(dto, 'customUnit'), note: nullableString(dto, 'note'),
    responsibleMemberId: nullableString(dto, 'responsibleMemberId'), addedByMemberId: string(dto, 'addedByMemberId'),
    purchasedByMemberId: nullableString(dto, 'purchasedByMemberId'), status: oneOf(dto, 'status', ['PENDING', 'PURCHASED']),
    position: number(dto, 'position'), createdAt: string(dto, 'createdAt'), updatedAt: string(dto, 'updatedAt'),
    purchasedAt: nullableString(dto, 'purchasedAt'), version: number(dto, 'version'),
  } satisfies ShoppingItem;
}

export function mapCalendarOptions(value: unknown): readonly CalendarSeriesOption[] {
  if (!Array.isArray(value)) invalid();
  return value.map(item => { const dto = object(item); return { seriesId: string(dto, 'seriesId'), title: string(dto, 'title'), kind: string(dto, 'kind'), startDate: string(dto, 'startDate') }; });
}

function items(value: unknown): readonly ShoppingItem[] { if (!Array.isArray(value)) invalid(); return value.map(mapShoppingItem); }
function object(value: unknown): Json { if (typeof value !== 'object' || value === null || Array.isArray(value)) invalid(); return value as Json; }
function string(value: Json, key: string): string { const field = value[key]; if (typeof field !== 'string') invalid(); return field; }
function number(value: Json, key: string): number { const field = value[key]; if (typeof field !== 'number' || !Number.isFinite(field)) invalid(); return field; }
function nullableString(value: Json, key: string): string | null { const field = value[key]; if (field === null) return null; if (typeof field !== 'string') invalid(); return field; }
function nullableNumber(value: Json, key: string): number | null { const field = value[key]; if (field === null) return null; if (typeof field !== 'number' || !Number.isFinite(field)) invalid(); return field; }
function oneOf<T extends string>(value: Json, key: string, allowed: readonly T[]): T { const field = string(value, key); if (!allowed.includes(field as T)) invalid(); return field as T; }
function nullableOneOf<T extends string>(value: Json, key: string, allowed: readonly T[]): T | null { const field = value[key]; if (field === null) return null; if (typeof field !== 'string' || !allowed.includes(field as T)) invalid(); return field as T; }
function invalid(): never { throw new ShoppingListApplicationError('unexpected', 'Invalid shopping list response'); }
