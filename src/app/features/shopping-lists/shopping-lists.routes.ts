import { Routes } from '@angular/router';

export const SHOPPING_LIST_ROUTES: Routes = [
  { path: 'trash', loadComponent: () => import('./presentation/trash/shopping-list-trash.component').then(module => module.ShoppingListTrashComponent), data: { titleKey: 'metadata.shoppingListsTrash' } },
  { path: '', pathMatch: 'full', loadComponent: () => import('./presentation/list/shopping-lists.component').then(module => module.ShoppingListsComponent), data: { titleKey: 'metadata.shoppingLists' } },
];
