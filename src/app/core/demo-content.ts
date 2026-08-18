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
    role: 'miembro',
    initials: 'LU',
    color: 'bg-ncasa-coral text-ncasa-cream',
    balance: -18.2,
  },
  {
    id: 'm3',
    name: 'Marco',
    email: 'marco@ncasa.app',
    role: 'miembro',
    initials: 'MA',
    color: 'bg-ncasa-sage text-ncasa-forest',
    balance: -16.3,
  },
];

export const PENDING_INVITES = [
  { id: 'i1', email: 'julia@correo.com', sentAgo: 'Hace 2 días', role: 'miembro' },
];

export const CATEGORIES = [
  { key: 'supermercado', label: 'Supermercado', icon: 'shopping-cart' },
  { key: 'electricidad', label: 'Electricidad', icon: 'zap' },
  { key: 'internet', label: 'Internet', icon: 'wifi' },
  { key: 'alquiler', label: 'Alquiler', icon: 'home' },
  { key: 'cena', label: 'Cena', icon: 'utensils' },
  { key: 'otros', label: 'Otros', icon: 'tag' },
];

export const EXPENSES = [
  {
    id: 'e1',
    concept: 'Compra semanal',
    category: 'supermercado',
    paidById: 'm1',
    paidByName: 'Dani',
    date: '12 may',
    amount: 84.3,
    status: 'repartido',
    includedMemberIds: ['m1', 'm2', 'm3'],
  },
  {
    id: 'e2',
    concept: 'Factura de electricidad',
    category: 'electricidad',
    paidById: 'm2',
    paidByName: 'Lucía',
    date: '10 may',
    amount: 61.15,
    status: 'pendiente',
    includedMemberIds: ['m1', 'm2', 'm3'],
  },
  {
    id: 'e3',
    concept: 'Internet fibra',
    category: 'internet',
    paidById: 'm3',
    paidByName: 'Marco',
    date: '8 may',
    amount: 39.99,
    status: 'repartido',
    includedMemberIds: ['m1', 'm2', 'm3'],
  },
  {
    id: 'e4',
    concept: 'Alquiler del piso',
    category: 'alquiler',
    paidById: 'm1',
    paidByName: 'Dani',
    date: '5 may',
    amount: 420,
    status: 'liquidado',
    includedMemberIds: ['m1', 'm2', 'm3'],
  },
  {
    id: 'e5',
    concept: 'Cena en casa',
    category: 'cena',
    paidById: 'm2',
    paidByName: 'Lucía',
    date: '3 may',
    amount: 27.5,
    status: 'repartido',
    includedMemberIds: ['m1', 'm2'],
  },
];

export const EVENT_CATEGORIES = [
  {
    key: 'hogar',
    label: 'Hogar',
    icon: 'home',
    dot: 'bg-ncasa-sage',
    chip: 'bg-ncasa-sage-soft text-ncasa-forest',
  },
  {
    key: 'pagos',
    label: 'Pagos',
    icon: 'wallet',
    dot: 'bg-ncasa-coral',
    chip: 'bg-ncasa-coral/15 text-ncasa-coral-dark',
  },
  {
    key: 'citas',
    label: 'Citas',
    icon: 'heart',
    dot: 'bg-ncasa-forest',
    chip: 'bg-ncasa-forest/10 text-ncasa-forest',
  },
  {
    key: 'tareas',
    label: 'Tareas',
    icon: 'check-square',
    dot: 'bg-ncasa-charcoal',
    chip: 'bg-ncasa-charcoal/10 text-ncasa-charcoal',
  },
];

export const EVENTS = [
  { id: 'v1', title: 'Pagar internet', category: 'pagos', day: 8, time: '10:00', dateLabel: 'Mié 8 may' },
  { id: 'v2', title: 'Compra semanal', category: 'hogar', day: 12, time: '18:30', dateLabel: 'Dom 12 may' },
  { id: 'v3', title: 'Revisión del coche', category: 'tareas', day: 15, time: '09:30', dateLabel: 'Mié 15 may' },
  { id: 'v4', title: 'Cena familiar', category: 'citas', day: 18, time: '21:00', dateLabel: 'Sáb 18 may' },
  { id: 'v5', title: 'Pagar alquiler', category: 'pagos', day: 5, time: '12:00', dateLabel: 'Dom 5 may' },
];

export const HOUSEHOLD_NAME = 'Casa Verde';
