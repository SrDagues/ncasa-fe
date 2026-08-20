import { HttpClient } from '@angular/common/http';
import { EnvironmentProviders, Provider, inject, makeEnvironmentProviders } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HouseholdApplicationService } from '../application/household-application.service';
import { HouseholdStore } from '../presentation/household.store';
import { HttpHouseholdGateway } from './http/http-household.gateway';
import { LocalActiveHouseholdStorage } from './storage/local-active-household.storage';
import { ACTIVE_HOUSEHOLD_STORAGE } from './storage/active-household-storage.token';

export function provideHousehold(): EnvironmentProviders {
  const providers: Provider[] = [
    { provide: HttpHouseholdGateway, useFactory: () => new HttpHouseholdGateway(inject(HttpClient), environment.apiUrl) },
    { provide: ACTIVE_HOUSEHOLD_STORAGE, useFactory: () => new LocalActiveHouseholdStorage() },
    { provide: HouseholdApplicationService, useFactory: () => {
      const gateway = inject(HttpHouseholdGateway); return new HouseholdApplicationService(gateway, gateway, gateway);
    } },
    HouseholdStore,
  ];
  return makeEnvironmentProviders(providers);
}
