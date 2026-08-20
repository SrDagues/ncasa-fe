import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { HouseholdApplicationService } from '../application/household-application.service';
import { Household, HouseholdSummary, InvitationResult } from '../domain/household.models';
import { ACTIVE_HOUSEHOLD_STORAGE } from '../infrastructure/storage/active-household-storage.token';
import { HouseholdStore } from './household.store';

const summary: HouseholdSummary = {
  id: 'h1', name: 'Casa real', status: 'ACTIVE', currentMemberId: 'm1', currentRole: 'ADMIN', owner: true,
};
const household: Household = {
  id: 'h1', name: 'Casa real', status: 'ACTIVE', ownerMemberId: 'm1', createdBy: 1,
  createdAt: '2026-08-20T10:00:00Z', members: [{ id: 'm1', accountId: 1, email: 'owner@example.com',
    role: 'ADMIN', status: 'ACTIVE', owner: true, joinedAt: '2026-08-20T10:00:00Z',
    statusChangedAt: '2026-08-20T10:00:00Z' }],
};
const secondSummary: HouseholdSummary = { ...summary, id: 'h2', name: 'Casa del pueblo', currentMemberId: 'm2', owner: false };
const secondHousehold: Household = {
  ...household, id: 'h2', name: 'Casa del pueblo', ownerMemberId: 'owner', members: [
    { ...household.members[0], id: 'm2', role: 'MEMBER', owner: false },
    { ...household.members[0], id: 'owner', accountId: 2, email: 'other@example.com', owner: true },
  ],
};

describe('HouseholdStore', () => {
  let application: {
    list: () => Observable<readonly HouseholdSummary[]>;
    listReceived: () => Observable<readonly []>;
    get: (id: string) => Observable<Household>;
    listSent: (id: string) => Observable<readonly []>;
    invite: () => Observable<InvitationResult>;
  };
  let selected: string | null;

  beforeEach(() => {
    selected = 'missing';
    application = {
      list: () => of([summary]), listReceived: () => of([]), get: () => of(household), listSent: () => of([]),
      invite: () => of({ id: 'i1', householdId: 'h1', email: 'person@example.com', role: 'MEMBER' as const,
        status: 'PENDING', expiresAt: '2026-08-27T10:00:00Z', deliverySucceeded: false }),
    };
    TestBed.configureTestingModule({ providers: [
      HouseholdStore,
      { provide: HouseholdApplicationService, useValue: application },
      { provide: ACTIVE_HOUSEHOLD_STORAGE, useValue: {
        read: () => selected, write: (_accountId: number, id: string) => { selected = id; }, remove: () => { selected = null; },
      } },
    ] });
  });

  it('falls back to the first available household when the persisted selection is invalid', async () => {
    const store = TestBed.inject(HouseholdStore);
    await store.initialize(1);
    expect(store.state()).toBe('ready');
    expect(store.active()?.name).toBe('Casa real');
    expect(selected).toBe('h1');
  });

  it('enters the onboarding state when the account has no households', async () => {
    application.list = () => of([]);
    const store = TestBed.inject(HouseholdStore);
    await store.initialize(1);
    expect(store.state()).toBe('empty');
  });

  it('loads the members of the household selected inside the household view', async () => {
    application.list = () => of([summary, secondSummary]);
    application.get = id => of(id === 'h2' ? secondHousehold : household);
    const store = TestBed.inject(HouseholdStore);
    await store.initialize(1);
    await store.select('h2');
    expect(store.active()?.name).toBe('Casa del pueblo');
    expect(store.members().map(member => member.email)).toEqual(['owner@example.com', 'other@example.com']);
    expect(selected).toBe('h2');
  });

  it('keeps a saved invitation visible as a delivery warning when SMTP fails', async () => {
    const store = TestBed.inject(HouseholdStore);
    await store.initialize(1);
    await store.invite('person@example.com', 'MEMBER');
    expect(store.deliveryWarning()).toBe(true);
  });
});
