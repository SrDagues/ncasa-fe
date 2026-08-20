import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { HouseholdApplicationError, HouseholdErrorKind } from '../../application/household.errors';
import { HouseholdCommandPort, HouseholdInvitationPort, HouseholdQueryPort } from '../../application/ports/household.ports';
import { Household, HouseholdId, HouseholdRole, HouseholdSummary, InvitationId, InvitationResult, MemberId, ReceivedInvitation, SentInvitation } from '../../domain/household.models';
import { mapArray, mapHousehold, mapInvitationResult, mapReceivedInvitation, mapSentInvitation, mapSummary } from './household-api.mapper';

export class HttpHouseholdGateway implements HouseholdQueryPort, HouseholdCommandPort, HouseholdInvitationPort {
  constructor(private readonly http: HttpClient, private readonly apiUrl: string) {}

  list(): Observable<readonly HouseholdSummary[]> {
    return this.http.get<unknown>(`${this.apiUrl}/households`).pipe(map(value => mapArray(value, mapSummary)), this.errors());
  }
  get(id: HouseholdId): Observable<Household> {
    return this.http.get<unknown>(`${this.apiUrl}/households/${id}`).pipe(map(mapHousehold), this.errors());
  }
  create(name: string): Observable<Household> {
    return this.http.post<unknown>(`${this.apiUrl}/households`, { name }).pipe(map(mapHousehold), this.errors());
  }
  rename(id: HouseholdId, name: string): Observable<Household> {
    return this.http.patch<unknown>(`${this.apiUrl}/households/${id}`, { name }).pipe(map(mapHousehold), this.errors());
  }
  changeRole(id: HouseholdId, memberId: MemberId, role: HouseholdRole): Observable<Household> {
    return this.http.patch<unknown>(`${this.apiUrl}/households/${id}/members/${memberId}/role`, { role }).pipe(map(mapHousehold), this.errors());
  }
  transferOwnership(id: HouseholdId, memberId: MemberId): Observable<Household> {
    return this.http.post<unknown>(`${this.apiUrl}/households/${id}/ownership-transfers`, { memberId }).pipe(map(mapHousehold), this.errors());
  }
  removeMember(id: HouseholdId, memberId: MemberId): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/households/${id}/members/${memberId}`).pipe(this.errors());
  }
  leave(id: HouseholdId): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/households/${id}/leave`, {}).pipe(this.errors());
  }
  archive(id: HouseholdId): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/households/${id}`).pipe(this.errors());
  }
  listReceived(): Observable<readonly ReceivedInvitation[]> {
    return this.http.get<unknown>(`${this.apiUrl}/household-invitations/pending`).pipe(map(value => mapArray(value, mapReceivedInvitation)), this.errors());
  }
  listSent(id: HouseholdId): Observable<readonly SentInvitation[]> {
    return this.http.get<unknown>(`${this.apiUrl}/households/${id}/invitations`, { params: { status: 'PENDING' } })
      .pipe(map(value => mapArray(value, mapSentInvitation)), this.errors());
  }
  invite(id: HouseholdId, email: string, role: HouseholdRole): Observable<InvitationResult> {
    return this.http.post<unknown>(`${this.apiUrl}/households/${id}/invitations`, { email, role }).pipe(map(mapInvitationResult), this.errors());
  }
  cancel(id: HouseholdId, invitationId: InvitationId): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/households/${id}/invitations/${invitationId}`).pipe(this.errors());
  }
  accept(invitationId: InvitationId): Observable<Household> {
    return this.http.post<unknown>(`${this.apiUrl}/household-invitations/${invitationId}/accept`, {}).pipe(map(mapHousehold), this.errors());
  }

  private errors<T>(): (source: Observable<T>) => Observable<T> {
    return source => source.pipe(catchError((failure: unknown) => throwError(() => this.normalize(failure))));
  }
  private normalize(failure: unknown): HouseholdApplicationError {
    if (failure instanceof HouseholdApplicationError) return failure;
    if (!(failure instanceof HttpErrorResponse)) return new HouseholdApplicationError('unexpected', 'Unexpected error');
    const kinds: Readonly<Record<number, HouseholdErrorKind>> = {
      0: 'network', 400: 'validation', 401: 'unauthenticated', 403: 'forbidden', 404: 'not-found', 409: 'conflict', 410: 'expired',
    };
    const body = typeof failure.error === 'object' && failure.error !== null ? failure.error as Readonly<Record<string, unknown>> : {};
    const message = typeof body['message'] === 'string' ? body['message'] : failure.message;
    const fieldsValue = body['fields'];
    const fields = typeof fieldsValue === 'object' && fieldsValue !== null ? fieldsValue as Readonly<Record<string, string>> : {};
    return new HouseholdApplicationError(kinds[failure.status] ?? 'unexpected', message, fields);
  }
}
