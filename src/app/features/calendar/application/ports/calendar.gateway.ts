import { Observable } from 'rxjs';
import { CalendarDraft, CalendarEntry, CalendarOccurrence } from '../../domain/calendar.models';

export interface CalendarGateway {
  list(householdId: string, from: string, to: string): Observable<readonly CalendarOccurrence[]>;
  get(householdId: string, itemId: string): Observable<CalendarEntry>;
  create(householdId: string, draft: CalendarDraft): Observable<CalendarEntry>;
  update(householdId: string, itemId: string, version: number, draft: CalendarDraft, effectiveFrom?: string): Observable<CalendarEntry>;
  trash(householdId: string): Observable<readonly CalendarEntry[]>;
  moveToTrash(householdId: string, itemId: string, version: number, effectiveFrom?: string): Observable<CalendarEntry>;
  restore(householdId: string, itemId: string, version: number): Observable<CalendarEntry>;
  purge(householdId: string, itemId: string, version: number): Observable<void>;
  setOccurrenceCompleted(householdId: string, itemId: string, occurrenceKey: string, version: number, completed: boolean): Observable<CalendarEntry>;
}
