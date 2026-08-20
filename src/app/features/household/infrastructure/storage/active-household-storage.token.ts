import { InjectionToken } from '@angular/core';
import { ActiveHouseholdStoragePort } from '../../application/ports/household.ports';

export const ACTIVE_HOUSEHOLD_STORAGE = new InjectionToken<ActiveHouseholdStoragePort>('ActiveHouseholdStorage');
