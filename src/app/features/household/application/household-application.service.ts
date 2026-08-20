import { Observable } from 'rxjs';
import { Household, HouseholdId, HouseholdRole, HouseholdSummary, InvitationId, InvitationResult, MemberId, ReceivedInvitation, SentInvitation } from '../domain/household.models';
import { HouseholdCommandPort, HouseholdInvitationPort, HouseholdQueryPort } from './ports/household.ports';

export class HouseholdApplicationService {
  constructor(private readonly queries: HouseholdQueryPort, private readonly commands: HouseholdCommandPort,
    private readonly invitations: HouseholdInvitationPort) {}
  list(): Observable<readonly HouseholdSummary[]> { return this.queries.list(); }
  get(id: HouseholdId): Observable<Household> { return this.queries.get(id); }
  create(name: string): Observable<Household> { return this.commands.create(name.trim()); }
  rename(id: HouseholdId, name: string): Observable<Household> { return this.commands.rename(id, name.trim()); }
  listReceived(): Observable<readonly ReceivedInvitation[]> { return this.invitations.listReceived(); }
  listSent(id: HouseholdId): Observable<readonly SentInvitation[]> { return this.invitations.listSent(id); }
  invite(id: HouseholdId, email: string, role: HouseholdRole): Observable<InvitationResult> {
    return this.invitations.invite(id, email.trim().toLowerCase(), role);
  }
  cancel(id: HouseholdId, invitationId: InvitationId): Observable<void> { return this.invitations.cancel(id, invitationId); }
  accept(invitationId: InvitationId): Observable<Household> { return this.invitations.accept(invitationId); }
  changeRole(id: HouseholdId, memberId: MemberId, role: HouseholdRole): Observable<Household> {
    return this.commands.changeRole(id, memberId, role);
  }
  transferOwnership(id: HouseholdId, memberId: MemberId): Observable<Household> {
    return this.commands.transferOwnership(id, memberId);
  }
  removeMember(id: HouseholdId, memberId: MemberId): Observable<void> { return this.commands.removeMember(id, memberId); }
  leave(id: HouseholdId): Observable<void> { return this.commands.leave(id); }
  archive(id: HouseholdId): Observable<void> { return this.commands.archive(id); }
}
