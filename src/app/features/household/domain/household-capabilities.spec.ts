import { describe, expect, it } from 'vitest';
import { householdCapabilities } from './household-capabilities';
import { Household } from './household.models';

const household = (role: 'ADMIN' | 'MEMBER', owner: boolean): Household => ({
  id: 'h1', name: 'Casa', status: 'ACTIVE', ownerMemberId: owner ? 'm1' : 'owner', createdBy: 1,
  createdAt: '2026-08-20T10:00:00Z', members: [
    { id: 'm1', accountId: 1, email: 'me@example.com', role, status: 'ACTIVE', owner,
      joinedAt: '2026-08-20T10:00:00Z', statusChangedAt: '2026-08-20T10:00:00Z' },
    ...(owner ? [] : [{ id: 'owner', accountId: 2, email: 'owner@example.com', role: 'ADMIN' as const,
      status: 'ACTIVE' as const, owner: true, joinedAt: '2026-08-20T10:00:00Z', statusChangedAt: '2026-08-20T10:00:00Z' }]),
  ],
});

describe('householdCapabilities', () => {
  it('allows a member to leave but not administer the household', () => {
    const result = householdCapabilities(household('MEMBER', false), 1);
    expect(result.canLeave).toBe(true);
    expect(result.canInviteMember).toBe(false);
  });

  it('allows an administrator to invite members but not administrators', () => {
    const result = householdCapabilities(household('ADMIN', false), 1);
    expect(result.canInviteMember).toBe(true);
    expect(result.canInviteAdmin).toBe(false);
  });

  it('allows the sole owner to archive but not leave', () => {
    const result = householdCapabilities(household('ADMIN', true), 1);
    expect(result.canArchive).toBe(true);
    expect(result.canLeave).toBe(false);
    expect(result.canManageRoles).toBe(true);
  });
});
