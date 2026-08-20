/** Contenido visual temporal. No representa contratos del backend ni se persiste. */

export const MEMBERS = [
  {
    id: 'm1',
    name: 'Dani',
    email: 'dani@ncasa.app',
    role: 'admin',
    initials: 'DA',
    color: 'bg-ncasa-forest text-ncasa-cream',
    balance: 34.5,
  },
  {
    id: 'm2',
    name: 'Lucía',
    email: 'lucia@ncasa.app',
    role: 'member',
    initials: 'LU',
    color: 'bg-ncasa-coral text-ncasa-cream',
    balance: -18.2,
  },
  {
    id: 'm3',
    name: 'Marco',
    email: 'marco@ncasa.app',
    role: 'member',
    initials: 'MA',
    color: 'bg-ncasa-sage text-ncasa-forest',
    balance: -16.3,
  },
];

export const PENDING_INVITES = [
  { id: 'i1', email: 'julia@correo.com', sentAgoKey: 'household.sentAgo', role: 'member' },
];

export const CATEGORIES = [
  { key: 'supermercado', labelKey: 'expenses.categories.supermarket', icon: 'shopping-cart' },
  { key: 'electricidad', labelKey: 'expenses.categories.electricity', icon: 'zap' },
  { key: 'internet', labelKey: 'expenses.categories.internet', icon: 'wifi' },
  { key: 'alquiler', labelKey: 'expenses.categories.rent', icon: 'home' },
  { key: 'cena', labelKey: 'expenses.categories.dinner', icon: 'utensils' },
  { key: 'otros', labelKey: 'expenses.categories.other', icon: 'tag' },
];

export const EXPENSES = [
  {
    id: 'e1',
    conceptKey: 'demo.weeklyShop',
    category: 'supermercado',
    paidById: 'm1',
    paidByName: 'Dani',
    date: '2024-05-12',
    amount: 84.3,
    status: 'split',
    includedMemberIds: ['m1', 'm2', 'm3'],
  },
  {
    id: 'e2',
    conceptKey: 'demo.electricityBill',
    category: 'electricidad',
    paidById: 'm2',
    paidByName: 'Lucía',
    date: '2024-05-10',
    amount: 61.15,
    status: 'pending',
    includedMemberIds: ['m1', 'm2', 'm3'],
  },
  {
    id: 'e3',
    conceptKey: 'demo.fiberInternet',
    category: 'internet',
    paidById: 'm3',
    paidByName: 'Marco',
    date: '2024-05-08',
    amount: 39.99,
    status: 'split',
    includedMemberIds: ['m1', 'm2', 'm3'],
  },
  {
    id: 'e4',
    conceptKey: 'demo.rent',
    category: 'alquiler',
    paidById: 'm1',
    paidByName: 'Dani',
    date: '2024-05-05',
    amount: 420,
    status: 'settled',
    includedMemberIds: ['m1', 'm2', 'm3'],
  },
  {
    id: 'e5',
    conceptKey: 'demo.dinnerAtHome',
    category: 'cena',
    paidById: 'm2',
    paidByName: 'Lucía',
    date: '2024-05-03',
    amount: 27.5,
    status: 'split',
    includedMemberIds: ['m1', 'm2'],
  },
];

export const EVENT_CATEGORIES = [
  {
    key: 'hogar',
    labelKey: 'calendar.categories.home',
    icon: 'home',
    dot: 'bg-ncasa-sage',
    chip: 'bg-ncasa-sage-soft text-ncasa-forest',
  },
  {
    key: 'pagos',
    labelKey: 'calendar.categories.payments',
    icon: 'wallet',
    dot: 'bg-ncasa-coral',
    chip: 'bg-ncasa-coral/15 text-ncasa-coral-dark',
  },
  {
    key: 'citas',
    labelKey: 'calendar.categories.appointments',
    icon: 'heart',
    dot: 'bg-ncasa-forest',
    chip: 'bg-ncasa-forest/10 text-ncasa-forest',
  },
  {
    key: 'tareas',
    labelKey: 'calendar.categories.tasks',
    icon: 'check-square',
    dot: 'bg-ncasa-charcoal',
    chip: 'bg-ncasa-charcoal/10 text-ncasa-charcoal',
  },
];

export const EVENTS = [
  { id: 'v1', titleKey: 'demo.payInternet', category: 'pagos', day: 8, time: '10:00', date: '2024-05-08' },
  { id: 'v2', titleKey: 'demo.weeklyShop', category: 'hogar', day: 12, time: '18:30', date: '2024-05-12' },
  { id: 'v3', titleKey: 'demo.carService', category: 'tareas', day: 15, time: '09:30', date: '2024-05-15' },
  { id: 'v4', titleKey: 'demo.familyDinner', category: 'citas', day: 18, time: '21:00', date: '2024-05-18' },
  { id: 'v5', titleKey: 'demo.payRent', category: 'pagos', day: 5, time: '12:00', date: '2024-05-05' },
];
