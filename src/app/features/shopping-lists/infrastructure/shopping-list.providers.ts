import { HttpClient } from '@angular/common/http';
import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ShoppingListsApplication } from '../application/shopping-lists.application';
import { ShoppingListsStore } from '../presentation/shopping-lists.store';
import { BrowserLastShoppingListStorage, LAST_SHOPPING_LIST_STORAGE } from './browser/last-shopping-list.storage';
import { HttpShoppingListGateway } from './http/http-shopping-list.gateway';

export function provideShoppingLists(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: HttpShoppingListGateway, useFactory: () => new HttpShoppingListGateway(inject(HttpClient), environment.apiUrl) },
    { provide: LAST_SHOPPING_LIST_STORAGE, useFactory: () => new BrowserLastShoppingListStorage() },
    { provide: ShoppingListsApplication, useFactory: () => new ShoppingListsApplication(inject(HttpShoppingListGateway)) },
    ShoppingListsStore,
  ]);
}
