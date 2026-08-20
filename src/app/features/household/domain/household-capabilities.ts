import { Household, HouseholdMember } from './household.models';

export interface HouseholdCapabilities {
  readonly canRename: boolean;
  readonly canInviteMember: boolean;
  readonly canInviteAdmin: boolean;
  readonly canManageRoles: boolean;
  readonly canTransferOwnership: boolean;
  readonly canRemoveMembers: boolean;
  readonly canLeave: boolean;
  readonly canArchive: boolean;
}

const NONE: HouseholdCapabilities = {
  canRename: false,
  canInviteMember: false,
  canInviteAdmin: false,
  canManageRoles: false,
  canTransferOwnership: false,
  canRemoveMembers: false,
  canLeave: false,
  canArchive: false,
};

export function householdCapabilities(household: Household | null, accountId: number | null): HouseholdCapabilities {
  if (!household || household.status !== 'ACTIVE' || accountId === null) return NONE;
  const current = household.members.find((member) => member.accountId === accountId && member.status === 'ACTIVE');
  if (!current) return NONE;
  const owner = current.id === household.ownerMemberId;
  const admin = current.role === 'ADMIN';
  return {
    canRename: admin,
    canInviteMember: admin,
    canInviteAdmin: owner,
    canManageRoles: owner,
    canTransferOwnership: owner,
    canRemoveMembers: admin,
    canLeave: !owner,
    canArchive: owner && household.members.filter((member) => member.status === 'ACTIVE').length === 1,
  };
}

export function canRemoveMember(household: Household, actorAccountId: number, target: HouseholdMember): boolean {
  const actor = household.members.find((member) => member.accountId === actorAccountId && member.status === 'ACTIVE');
  if (!actor || actor.role !== 'ADMIN' || actor.id === target.id || target.owner || target.status !== 'ACTIVE') return false;
  return target.role === 'MEMBER' || actor.owner;
}
