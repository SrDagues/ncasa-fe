import { Household, HouseholdMember, HouseholdRole, HouseholdSummary, InvitationResult, ReceivedInvitation, SentInvitation } from '../../domain/household.models';
import { HouseholdApplicationError } from '../../application/household.errors';

type Json = Readonly<Record<string, unknown>>;
const object = (value: unknown): Json => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new HouseholdApplicationError('unexpected', 'Invalid server response');
  return value as Json;
};
const string = (value: unknown): string => {
  if (typeof value !== 'string') throw new HouseholdApplicationError('unexpected', 'Invalid server response');
  return value;
};
const number = (value: unknown): number => {
  if (typeof value !== 'number') throw new HouseholdApplicationError('unexpected', 'Invalid server response');
  return value;
};
const boolean = (value: unknown): boolean => {
  if (typeof value !== 'boolean') throw new HouseholdApplicationError('unexpected', 'Invalid server response');
  return value;
};
const role = (value: unknown): HouseholdRole => {
  if (value !== 'ADMIN' && value !== 'MEMBER') throw new HouseholdApplicationError('unexpected', 'Invalid household role');
  return value;
};
const nullableString = (value: unknown): string | null => value === null || value === undefined ? null : string(value);

export const mapSummary = (value: unknown): HouseholdSummary => {
  const dto = object(value);
  const status = string(dto['status']);
  if (status !== 'ACTIVE' && status !== 'ARCHIVED') throw new HouseholdApplicationError('unexpected', 'Invalid household status');
  return { id: string(dto['id']), name: string(dto['name']), status, currentMemberId: string(dto['currentMemberId']),
    currentRole: role(dto['currentRole']), owner: boolean(dto['owner']) };
};

export const mapMember = (value: unknown): HouseholdMember => {
  const dto = object(value);
  const status = string(dto['status']);
  if (status !== 'ACTIVE' && status !== 'LEFT' && status !== 'REMOVED') throw new HouseholdApplicationError('unexpected', 'Invalid membership status');
  return { id: string(dto['id']), accountId: number(dto['accountId']), email: nullableString(dto['email']), role: role(dto['role']),
    status, owner: boolean(dto['owner']), joinedAt: string(dto['joinedAt']), statusChangedAt: string(dto['statusChangedAt']) };
};

export const mapHousehold = (value: unknown): Household => {
  const dto = object(value);
  const members = dto['members'];
  const status = string(dto['status']);
  if (!Array.isArray(members) || (status !== 'ACTIVE' && status !== 'ARCHIVED')) throw new HouseholdApplicationError('unexpected', 'Invalid household response');
  return { id: string(dto['id']), name: string(dto['name']), status, ownerMemberId: string(dto['ownerMemberId']),
    createdBy: number(dto['createdBy']), createdAt: string(dto['createdAt']), members: members.map(mapMember) };
};

export const mapReceivedInvitation = (value: unknown): ReceivedInvitation => {
  const dto = object(value);
  return { id: string(dto['id']), householdId: string(dto['householdId']), householdName: string(dto['householdName']),
    role: role(dto['role']), invitedBy: string(dto['invitedBy']), invitedByEmail: nullableString(dto['invitedByEmail']),
    createdAt: string(dto['createdAt']), expiresAt: string(dto['expiresAt']) };
};

export const mapSentInvitation = (value: unknown): SentInvitation => {
  const dto = object(value);
  if (dto['status'] !== 'PENDING') throw new HouseholdApplicationError('unexpected', 'Invalid invitation status');
  return { id: string(dto['id']), householdId: string(dto['householdId']), email: string(dto['email']), role: role(dto['role']),
    status: 'PENDING', invitedBy: string(dto['invitedBy']), createdAt: string(dto['createdAt']), expiresAt: string(dto['expiresAt']) };
};

export const mapInvitationResult = (value: unknown): InvitationResult => {
  const dto = object(value);
  return { id: string(dto['id']), householdId: string(dto['householdId']), email: string(dto['email']),
    role: role(dto['role']), status: string(dto['status']), expiresAt: string(dto['expiresAt']),
    deliverySucceeded: boolean(dto['deliverySucceeded']) };
};

export const mapArray = <T>(value: unknown, mapper: (item: unknown) => T): readonly T[] => {
  if (!Array.isArray(value)) throw new HouseholdApplicationError('unexpected', 'Invalid server response');
  return value.map(mapper);
};
