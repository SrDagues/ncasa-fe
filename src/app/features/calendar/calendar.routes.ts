import { Routes } from '@angular/router';
import { ListCalendarOccurrencesUseCase } from './application/use-cases/calendar.use-cases';
import { CalendarMonthStore } from './presentation/month/calendar-month.store';

export const CALENDAR_ROUTES: Routes = [
  { path: 'new', loadComponent: () => import('./presentation/form/calendar-entry-form.component').then(m => m.CalendarEntryFormComponent), data: { titleKey: 'metadata.newCalendarItem' } },
  { path: 'trash', loadComponent: () => import('./presentation/trash/calendar-trash.component').then(m => m.CalendarTrashComponent), data: { titleKey: 'metadata.calendarTrash' } },
  { path: ':itemId/edit', loadComponent: () => import('./presentation/form/calendar-entry-form.component').then(m => m.CalendarEntryFormComponent), data: { titleKey: 'metadata.editCalendarItem' } },
  { path: ':itemId', loadComponent: () => import('./presentation/detail/calendar-entry-detail.component').then(m => m.CalendarEntryDetailComponent), data: { titleKey: 'metadata.calendarItem' } },
  { path: '', pathMatch: 'full', providers: [{ provide: CalendarMonthStore, useFactory: (list: ListCalendarOccurrencesUseCase) => new CalendarMonthStore(list), deps: [ListCalendarOccurrencesUseCase] }], loadComponent: () => import('./calendar.component').then(m => m.CalendarComponent) },
];
