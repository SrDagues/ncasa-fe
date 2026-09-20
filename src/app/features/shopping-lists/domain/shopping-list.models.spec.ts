import { describe, expect, it } from 'vitest';
import { normalizeShoppingListName, validateShoppingItemDraft } from './shopping-list.models';

describe('shopping list domain', () => {
  it('normalizes list names ignoring case and repeated spaces', () => {
    expect(normalizeShoppingListName('  Compra   Semanal ')).toBe('compra semanal');
  });

  it('requires a custom unit only when OTHER is selected', () => {
    expect(validateShoppingItemDraft({ name: 'Café', quantity: 1, unit: 'OTHER', customUnit: '', note: '', responsibleMemberId: null })).toEqual(['customUnit']);
    expect(validateShoppingItemDraft({ name: 'Café', quantity: 1, unit: 'GRAM', customUnit: '', note: '', responsibleMemberId: null })).toEqual([]);
  });

  it('rejects non-positive quantities and more than three decimals', () => {
    expect(validateShoppingItemDraft({ name: 'Leche', quantity: 0, unit: null, customUnit: '', note: '', responsibleMemberId: null })).toContain('quantity');
    expect(validateShoppingItemDraft({ name: 'Leche', quantity: 1.2345, unit: null, customUnit: '', note: '', responsibleMemberId: null })).toContain('quantity');
  });
});
