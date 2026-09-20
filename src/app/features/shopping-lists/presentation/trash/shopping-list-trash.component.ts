import { Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { HouseholdStore } from '../../../household';
import { ShoppingListSummary } from '../../domain/shopping-list.models';
import { ShoppingListsStore } from '../shopping-lists.store';

@Component({
  selector: 'app-shopping-list-trash',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './shopping-list-trash.component.html',
})
export class ShoppingListTrashComponent {
  protected readonly store = inject(ShoppingListsStore);
  private readonly household = inject(HouseholdStore);
  private readonly translate = inject(TranslateService);
  private readonly confirms = inject(ConfirmDialogService);

  constructor() { effect(() => { const id = this.household.active()?.id; if (id) void this.initialize(id); else this.store.reset(); }); }
  protected async purge(list: ShoppingListSummary): Promise<void> {
    if (await this.confirms.open({
      title: this.translate.instant('shoppingListConfirmations.purge.title'),
      message: this.translate.instant('shoppingLists.confirmPurge', { name: list.name }),
      confirmLabel: this.translate.instant('shoppingListConfirmations.purge.confirm'),
      cancelLabel: this.translate.instant('common.cancel'),
      variant: 'destructive',
    })) void this.store.purge(list);
  }
  private async initialize(id: string): Promise<void> { await this.store.initialize(id); await this.store.loadTrash(); }
}
