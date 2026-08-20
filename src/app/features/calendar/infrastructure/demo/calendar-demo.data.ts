/** Temporary adapter data until the Calendar API exists. */
export const EVENT_CATEGORIES = [
  { key: 'hogar', labelKey: 'calendar.categories.home', icon: 'home', dot: 'bg-ncasa-sage', chip: 'bg-ncasa-sage-soft text-ncasa-forest' },
  { key: 'pagos', labelKey: 'calendar.categories.payments', icon: 'wallet', dot: 'bg-ncasa-coral', chip: 'bg-ncasa-coral/15 text-ncasa-coral-dark' },
  { key: 'citas', labelKey: 'calendar.categories.appointments', icon: 'heart', dot: 'bg-ncasa-forest', chip: 'bg-ncasa-forest/10 text-ncasa-forest' },
  { key: 'tareas', labelKey: 'calendar.categories.tasks', icon: 'check-square', dot: 'bg-ncasa-charcoal', chip: 'bg-ncasa-charcoal/10 text-ncasa-charcoal' },
];

export const EVENTS = [
  { id: 'v1', titleKey: 'demo.payInternet', category: 'pagos', day: 8, time: '10:00', date: '2024-05-08' },
  { id: 'v2', titleKey: 'demo.weeklyShop', category: 'hogar', day: 12, time: '18:30', date: '2024-05-12' },
  { id: 'v3', titleKey: 'demo.carService', category: 'tareas', day: 15, time: '09:30', date: '2024-05-15' },
  { id: 'v4', titleKey: 'demo.familyDinner', category: 'citas', day: 18, time: '21:00', date: '2024-05-18' },
  { id: 'v5', titleKey: 'demo.payRent', category: 'pagos', day: 5, time: '12:00', date: '2024-05-05' },
];
