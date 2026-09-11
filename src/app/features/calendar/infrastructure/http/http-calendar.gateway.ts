import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { CalendarApplicationError, CalendarErrorKind } from '../../application/calendar.errors';
import { CalendarGateway } from '../../application/ports/calendar.gateway';
import { CalendarDraft, CalendarEntry, CalendarOccurrence } from '../../domain/calendar.models';
import { mapCalendarEntry, mapCalendarOccurrences } from './calendar-api.mapper';

export class HttpCalendarGateway implements CalendarGateway {
  constructor(private readonly http: HttpClient, private readonly apiUrl: string) {}

  list(householdId: string, from: string, to: string): Observable<readonly CalendarOccurrence[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<unknown>(this.collection(householdId), { params }).pipe(map(mapCalendarOccurrences), this.errors());
  }
  get(householdId: string, itemId: string): Observable<CalendarEntry> { return this.http.get<unknown>(`${this.collection(householdId)}/${itemId}`).pipe(map(mapCalendarEntry), this.errors()); }
  create(householdId: string, draft: CalendarDraft): Observable<CalendarEntry> { return this.http.post<unknown>(this.collection(householdId), draft).pipe(map(mapCalendarEntry), this.errors()); }
  update(householdId: string, itemId: string, version: number, draft: CalendarDraft, effectiveFrom?: string): Observable<CalendarEntry> {
    const params = effectiveFrom ? new HttpParams().set('effectiveFrom', effectiveFrom) : undefined;
    return this.http.put<unknown>(`${this.collection(householdId)}/${itemId}`, { version, entry: draft }, { params }).pipe(map(mapCalendarEntry), this.errors());
  }
  trash(householdId: string): Observable<readonly CalendarEntry[]> { return this.http.get<unknown>(`${this.collection(householdId)}/trash`).pipe(map(value => Array.isArray(value) ? value.map(mapCalendarEntry) : (() => { throw new CalendarApplicationError('unexpected', 'Invalid calendar response'); })()), this.errors()); }
  moveToTrash(householdId: string, itemId: string, version: number, effectiveFrom?: string): Observable<CalendarEntry> { return this.http.post<unknown>(`${this.collection(householdId)}/${itemId}/trash`, { version, effectiveFrom: effectiveFrom ?? null }).pipe(map(mapCalendarEntry), this.errors()); }
  restore(householdId: string, itemId: string, version: number): Observable<CalendarEntry> { return this.http.post<unknown>(`${this.collection(householdId)}/${itemId}/restore`, { version }).pipe(map(mapCalendarEntry), this.errors()); }
  purge(householdId: string, itemId: string, version: number): Observable<void> { return this.http.delete<void>(`${this.collection(householdId)}/${itemId}`, { params: new HttpParams().set('version', version) }).pipe(this.errors()); }
  setOccurrenceCompleted(householdId: string, itemId: string, occurrenceKey: string, version: number, completed: boolean): Observable<CalendarEntry> { const action = completed ? 'complete' : 'reopen'; return this.http.post<unknown>(`${this.collection(householdId)}/${itemId}/occurrences/${encodeURIComponent(occurrenceKey)}/${action}`, { version }).pipe(map(mapCalendarEntry), this.errors()); }

  private collection(householdId: string): string { return `${this.apiUrl}/households/${householdId}/calendar-items`; }
  private errors<T>(): (source: Observable<T>) => Observable<T> { return source => source.pipe(catchError((failure: unknown) => throwError(() => this.normalize(failure)))); }
  private normalize(failure: unknown): CalendarApplicationError { if (failure instanceof CalendarApplicationError) return failure; if (!(failure instanceof HttpErrorResponse)) return new CalendarApplicationError('unexpected', 'Unexpected error'); const kinds: Readonly<Record<number, CalendarErrorKind>> = { 0: 'network', 400: 'validation', 401: 'unauthenticated', 403: 'forbidden', 404: 'not-found', 409: 'conflict' }; const body = typeof failure.error === 'object' && failure.error !== null ? failure.error as Json : {}; const fields = typeof body['fields'] === 'object' && body['fields'] !== null ? body['fields'] as Readonly<Record<string, string>> : {}; return new CalendarApplicationError(kinds[failure.status] ?? 'unexpected', typeof body['message'] === 'string' ? body['message'] : failure.message, fields); }
}
type Json = Readonly<Record<string, unknown>>;
