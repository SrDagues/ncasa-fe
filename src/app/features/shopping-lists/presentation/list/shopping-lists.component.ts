import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, effect, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { FormField, form, maxLength, min, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { HouseholdStore } from '../../../household';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ShoppingItem, ShoppingItemDraft, ShoppingUnit, validateShoppingItemDraft } from '../../domain/shopping-list.models';
import { ShoppingListsStore } from '../shopping-lists.store';

interface ItemFormModel { name: string; quantity: number | null; note: string; unit: ShoppingUnit | ''; customUnit: string; responsibleMemberId: string; }
interface ListFormModel { name: string; calendarSeriesId: string; }

const EMPTY_ITEM: ItemFormModel = { name: '', quantity: null, note: '', unit: '', customUnit: '', responsibleMemberId: '' };

@Component({
  selector: 'app-shopping-lists',
  imports: [AvatarComponent, DragDropModule, FormField, RouterLink, TranslatePipe, IconComponent],
  templateUrl: './shopping-lists.component.html',
  styleUrl: './shopping-lists.component.css',
})
export class ShoppingListsComponent implements OnDestroy {
  protected readonly store = inject(ShoppingListsStore);
  protected readonly household = inject(HouseholdStore);
  private readonly translate = inject(TranslateService);
  private readonly confirms = inject(ConfirmDialogService);
  protected readonly advanced = signal(false);
  protected readonly invalidFields = signal<readonly (keyof ShoppingItemDraft)[]>([]);
  protected readonly itemModel = signal<ItemFormModel>({ ...EMPTY_ITEM });
  protected readonly itemForm = form(this.itemModel, fields => {
    required(fields.name); maxLength(fields.name, 160); min(fields.quantity, 0.001);
    maxLength(fields.note, 500); maxLength(fields.customUnit, 30);
  });
  protected readonly editModel = signal<ItemFormModel>({ ...EMPTY_ITEM });
  protected readonly editForm = form(this.editModel, fields => {
    required(fields.name); maxLength(fields.name, 160); min(fields.quantity, 0.001);
    maxLength(fields.note, 500); maxLength(fields.customUnit, 30);
  });
  protected readonly listModel = signal<ListFormModel>({ name: '', calendarSeriesId: '' });
  protected readonly listForm = form(this.listModel, fields => { required(fields.name); maxLength(fields.name, 80); });
  protected readonly dialogMode = signal<'create' | 'settings'>('create');
  protected readonly editingItem = signal<ShoppingItem | null>(null);
  protected readonly statusMessage = signal('');
  private readonly listDialog = viewChild<ElementRef<HTMLDialogElement>>('listDialog');
  private readonly itemDialog = viewChild<ElementRef<HTMLDialogElement>>('itemDialog');
  private readonly productInput = viewChild<ElementRef<HTMLInputElement>>('productInput');

  constructor() {
    effect(() => { const householdId = this.household.active()?.id; if (householdId) void this.store.initialize(householdId); else this.store.reset(); });
    this.store.startPolling();
  }

  ngOnDestroy(): void { this.store.stopPolling(); }

  protected async add(): Promise<void> {
    const draft = this.draft(this.itemModel()); const invalid = validateShoppingItemDraft(draft);
    this.invalidFields.set(invalid); if (invalid.length) return;
    if (await this.store.addItem(draft)) { this.itemModel.set({ ...EMPTY_ITEM }); this.invalidFields.set([]); this.productInput()?.nativeElement.focus(); }
  }

  protected selectList(event: Event): void { void this.store.select((event.target as HTMLSelectElement).value); }

  protected drop(event: CdkDragDrop<readonly ShoppingItem[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const copy = [...this.store.pending()]; moveItemInArray(copy, event.previousIndex, event.currentIndex);
    void this.store.reorderPending(copy.map(item => item.id));
  }

  protected move(item: ShoppingItem, delta: number): void {
    const copy = [...this.store.pending()]; const from = copy.findIndex(row => row.id === item.id); const to = from + delta;
    if (from < 0 || to < 0 || to >= copy.length) return; moveItemInArray(copy, from, to); void this.store.reorderPending(copy.map(row => row.id));
  }

  protected toggle(item: ShoppingItem, checked: boolean): void { void this.store.setPurchased(item, checked); }
  protected async deleteItem(item: ShoppingItem): Promise<void> {
    if (await this.confirm('deleteItem', 'shoppingLists.confirmDeleteItem', { name: item.name })) void this.store.deleteItem(item);
  }
  protected async clearPurchased(): Promise<void> {
    if (await this.confirm('clearPurchased', 'shoppingLists.confirmClearPurchased')) void this.store.clearPurchased();
  }
  protected async reusePurchased(): Promise<void> {
    const count = this.store.purchased().length;
    if (!count) return;
    const confirmed = await this.confirms.open({
      title: this.translate.instant('shoppingListConfirmations.reusePurchased.title'),
      message: this.translate.instant(count === 1
        ? 'shoppingLists.confirmReusePurchasedOne'
        : 'shoppingLists.confirmReusePurchasedMany', { count }),
      confirmLabel: this.translate.instant('shoppingListConfirmations.reusePurchased.confirm'),
      cancelLabel: this.translate.instant('common.cancel'),
      variant: 'primary',
    });
    if (confirmed && await this.store.reusePurchased()) {
      this.statusMessage.set(this.translate.instant(count === 1
        ? 'shoppingLists.reuseSuccessOne'
        : 'shoppingLists.reuseSuccessMany', { count }));
    }
  }
  protected async trashList(): Promise<void> {
    const list = this.store.current();
    if (list && await this.confirm('trashList', 'shoppingLists.confirmTrash', { name: list.name })) void this.store.moveCurrentToTrash();
  }

  protected openCreate(): void { this.dialogMode.set('create'); this.listModel.set({ name: '', calendarSeriesId: '' }); this.listDialog()?.nativeElement.showModal(); }
  protected async openSettings(): Promise<void> {
    await this.store.refreshCalendarOptions();
    const list = this.store.current();
    if (!list) return;
    this.dialogMode.set('settings');
    this.listModel.set({ name: list.name, calendarSeriesId: list.calendarSeriesId ?? '' });
    this.listDialog()?.nativeElement.showModal();
  }
  protected closeListDialog(): void { this.listDialog()?.nativeElement.close(); }
  protected async saveList(): Promise<void> { const value = this.listModel(); if (!value.name.trim() || value.name.trim().length > 80) return; const ok = this.dialogMode() === 'create' ? await this.store.create(value.name) : await this.store.updateList(value.name, value.calendarSeriesId || null); if (ok) this.closeListDialog(); }

  protected openEdit(item: ShoppingItem): void { this.editingItem.set(item); this.editModel.set({ name: item.name, quantity: item.quantity, note: item.note ?? '', unit: item.unit ?? '', customUnit: item.customUnit ?? '', responsibleMemberId: item.responsibleMemberId ?? '' }); this.itemDialog()?.nativeElement.showModal(); }
  protected closeItemDialog(): void { this.itemDialog()?.nativeElement.close(); this.editingItem.set(null); }
  protected async saveItem(): Promise<void> { const item = this.editingItem(); if (!item) return; const draft = this.draft(this.editModel()); const invalid = validateShoppingItemDraft(draft); this.invalidFields.set(invalid); if (invalid.length) return; if (await this.store.updateItem(item, draft)) this.closeItemDialog(); }
  protected memberLabel(memberId: string | null): string {
    if (!memberId) return this.translate.instant('shoppingLists.unassigned');
    return this.household.members().find(member => member.id === memberId)?.email
      ?? this.translate.instant('household.unknownAccount');
  }
  protected memberInitials(memberId: string | null): string {
    const label = this.memberLabel(memberId);
    const localPart = label.split('@')[0];
    const parts = localPart.split(/[._\-\s]+/).filter(Boolean);
    return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : localPart.slice(0, 2)).toUpperCase();
  }
  private draft(value: ItemFormModel): ShoppingItemDraft { return { name: value.name, quantity: value.quantity, note: value.note, unit: value.unit || null, customUnit: value.customUnit, responsibleMemberId: value.responsibleMemberId || null }; }
  private confirm(action: string, messageKey: string, params: Record<string, string> = {}): Promise<boolean> {
    return this.confirms.open({
      title: this.translate.instant(`shoppingListConfirmations.${action}.title`),
      message: this.translate.instant(messageKey, params),
      confirmLabel: this.translate.instant(`shoppingListConfirmations.${action}.confirm`),
      cancelLabel: this.translate.instant('common.cancel'),
      variant: 'destructive',
    });
  }
}
