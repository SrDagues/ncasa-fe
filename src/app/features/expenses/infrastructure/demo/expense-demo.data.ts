/** Temporary adapter data until the Expenses API exists. */
export const CATEGORIES = [
  { key: 'supermercado', labelKey: 'expenses.categories.supermarket', icon: 'shopping-cart' },
  { key: 'electricidad', labelKey: 'expenses.categories.electricity', icon: 'zap' },
  { key: 'internet', labelKey: 'expenses.categories.internet', icon: 'wifi' },
  { key: 'alquiler', labelKey: 'expenses.categories.rent', icon: 'home' },
  { key: 'cena', labelKey: 'expenses.categories.dinner', icon: 'utensils' },
  { key: 'otros', labelKey: 'expenses.categories.other', icon: 'tag' },
];

export const EXPENSES = [
  { id: 'e1', conceptKey: 'demo.weeklyShop', category: 'supermercado', paidById: 'm1', paidByName: 'Dani', date: '2024-05-12', amount: 84.3, status: 'split', includedMemberIds: ['m1', 'm2', 'm3'] },
  { id: 'e2', conceptKey: 'demo.electricityBill', category: 'electricidad', paidById: 'm2', paidByName: 'Lucía', date: '2024-05-10', amount: 61.15, status: 'pending', includedMemberIds: ['m1', 'm2', 'm3'] },
  { id: 'e3', conceptKey: 'demo.fiberInternet', category: 'internet', paidById: 'm3', paidByName: 'Marco', date: '2024-05-08', amount: 39.99, status: 'split', includedMemberIds: ['m1', 'm2', 'm3'] },
  { id: 'e4', conceptKey: 'demo.rent', category: 'alquiler', paidById: 'm1', paidByName: 'Dani', date: '2024-05-05', amount: 420, status: 'settled', includedMemberIds: ['m1', 'm2', 'm3'] },
  { id: 'e5', conceptKey: 'demo.dinnerAtHome', category: 'cena', paidById: 'm2', paidByName: 'Lucía', date: '2024-05-03', amount: 27.5, status: 'split', includedMemberIds: ['m1', 'm2'] },
];
