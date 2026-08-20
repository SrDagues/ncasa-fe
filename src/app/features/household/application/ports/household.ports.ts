import { Observable } from 'rxjs';
import { Household, HouseholdId, HouseholdRole, HouseholdSummary, InvitationId, InvitationResult, MemberId, ReceivedInvitation, SentInvitation } from '../../domain/household.models';

export interface HouseholdQueryPort {
  list(): Observable<readonly HouseholdSummary[]>;
  get(id: HouseholdId): Observable<Household>;
}

export interface HouseholdCommandPort {
  create(name: string): Observable<Household>;
  rename(id: HouseholdId, name: string): Observable<Household>;
  changeRole(id: HouseholdId, memberId: MemberId, role: HouseholdRole): Observable<Household>;
  transferOwnership(id: HouseholdId, memberId: MemberId): Observable<Household>;
  removeMember(id: HouseholdId, memberId: MemberId): Observable<void>;
  leave(id: HouseholdId): Observable<void>;
  archive(id: HouseholdId): Observable<void>;
}

export interface HouseholdInvitationPort {
  listReceived(): Observable<readonly ReceivedInvitation[]>;
  listSent(id: HouseholdId): Observable<readonly SentInvitation[]>;
  invite(id: HouseholdId, email: string, role: HouseholdRole): Observable<InvitationResult>;
  cancel(id: HouseholdId, invitationId: InvitationId): Observable<void>;
  accept(invitationId: InvitationId): Observable<Household>;
}

export interface ActiveHouseholdStoragePort {
  read(accountId: number): HouseholdId | null;
  write(accountId: number, householdId: HouseholdId): void;
  remove(accountId: number): void;
}
