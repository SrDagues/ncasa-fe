import { InjectionToken } from '@angular/core';
import { LastShoppingListStoragePort } from '../../application/ports/shopping-list.gateway';

export const LAST_SHOPPING_LIST_STORAGE = new InjectionToken<LastShoppingListStoragePort>('LAST_SHOPPING_LIST_STORAGE');

export class BrowserLastShoppingListStorage implements LastShoppingListStoragePort {
  read(householdId: string): string | null { return localStorage.getItem(this.key(householdId)); }
  write(householdId: string, listId: string): void { localStorage.setItem(this.key(householdId), listId); }
  remove(householdId: string): void { localStorage.removeItem(this.key(householdId)); }
  private key(householdId: string): string { return `ncasa.shopping-lists.last.${householdId}`; }
}
