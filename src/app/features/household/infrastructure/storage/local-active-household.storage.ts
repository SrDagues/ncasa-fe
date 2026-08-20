import { ActiveHouseholdStoragePort } from '../../application/ports/household.ports';
import { HouseholdId } from '../../domain/household.models';

export class LocalActiveHouseholdStorage implements ActiveHouseholdStoragePort {
  private key(accountId: number): string { return `ncasa.activeHouseholdId.${accountId}`; }
  read(accountId: number): HouseholdId | null { return globalThis.localStorage?.getItem(this.key(accountId)) ?? null; }
  write(accountId: number, householdId: HouseholdId): void { globalThis.localStorage?.setItem(this.key(accountId), householdId); }
  remove(accountId: number): void { globalThis.localStorage?.removeItem(this.key(accountId)); }
}
