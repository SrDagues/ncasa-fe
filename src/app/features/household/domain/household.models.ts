export type HouseholdId = string;
export type MemberId = string;
export type InvitationId = string;
export type HouseholdRole = 'ADMIN' | 'MEMBER';
export type MembershipStatus = 'ACTIVE' | 'LEFT' | 'REMOVED';
export type HouseholdStatus = 'ACTIVE' | 'ARCHIVED';

export interface HouseholdSummary {
  readonly id: HouseholdId;
  readonly name: string;
  readonly status: HouseholdStatus;
  readonly currentMemberId: MemberId;
  readonly currentRole: HouseholdRole;
  readonly owner: boolean;
}

export interface HouseholdMember {
  readonly id: MemberId;
  readonly accountId: number;
  readonly email: string | null;
  readonly role: HouseholdRole;
  readonly status: MembershipStatus;
  readonly owner: boolean;
  readonly joinedAt: string;
  readonly statusChangedAt: string;
}

export interface Household {
  readonly id: HouseholdId;
  readonly name: string;
  readonly status: HouseholdStatus;
  readonly ownerMemberId: MemberId;
  readonly createdBy: number;
  readonly createdAt: string;
  readonly members: readonly HouseholdMember[];
}

export interface ReceivedInvitation {
  readonly id: InvitationId;
  readonly householdId: HouseholdId;
  readonly householdName: string;
  readonly role: HouseholdRole;
  readonly invitedBy: MemberId;
  readonly invitedByEmail: string | null;
  readonly createdAt: string;
  readonly expiresAt: string;
}

export interface SentInvitation {
  readonly id: InvitationId;
  readonly householdId: HouseholdId;
  readonly email: string;
  readonly role: HouseholdRole;
  readonly status: 'PENDING';
  readonly invitedBy: MemberId;
  readonly createdAt: string;
  readonly expiresAt: string;
}

export interface InvitationResult {
  readonly id: InvitationId;
  readonly householdId: HouseholdId;
  readonly email: string;
  readonly role: HouseholdRole;
  readonly status: string;
  readonly expiresAt: string;
  readonly deliverySucceeded: boolean;
}
