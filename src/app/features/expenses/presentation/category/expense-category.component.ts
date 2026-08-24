import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { form, FormField, maxLength } from '@angular/forms/signals';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { HouseholdStore } from '../../../household';
import { ExpensesSectionNavComponent } from '../navigation/expenses-section-nav.component';
import { ExpenseCategoryStore } from './expense-category.store';

@Component({ selector: 'app-expense-category', imports: [FormField, TranslatePipe, ButtonComponent, CardComponent, EmptyStateComponent, ExpensesSectionNavComponent], templateUrl: './expense-category.component.html' })
export class ExpenseCategoryComponent {
  protected readonly household = inject(HouseholdStore); protected readonly store = inject(ExpenseCategoryStore);
  private readonly confirms = inject(ConfirmDialogService); private readonly notifications = inject(NotificationService); private readonly translate = inject(TranslateService);
  private readonly renameDialog = viewChild<ElementRef<HTMLDialogElement>>('renameDialog'); private trigger: HTMLElement | null = null;
  private readonly createModel = signal({ name: '' }); private readonly renameModel = signal({ name: '' });
  protected readonly createForm = form(this.createModel, schema => maxLength(schema.name, 80));
  protected readonly renameForm = form(this.renameModel, schema => maxLength(schema.name, 80));
  protected readonly selectedId = signal<string | null>(null); protected readonly createError = signal(false); protected readonly renameError = signal(false);
  protected readonly activeCategories = computed(() => this.store.categories().filter(item => item.status === 'ACTIVE'));
  protected readonly archivedCategories = computed(() => this.store.categories().filter(item => item.status === 'ARCHIVED'));
  protected readonly isAdmin = computed(() => { const active = this.household.active(); return this.household.households().find(item => item.id === active?.id)?.currentRole === 'ADMIN'; });
  constructor() { effect(() => { const id = this.household.active()?.id; if (id) void this.store.load(id); else this.store.reset(); }); }
  protected async create(event: Event): Promise<void> { event.preventDefault(); const id = this.household.active()?.id; const name = this.createModel().name.trim(); this.createError.set(!name || name.length > 80); if (!id || this.createError()) return; if (await this.store.create(id, name)) { this.createModel.set({ name: '' }); this.notify('expenseCategories.created'); } }
  protected openRename(id: string, name: string, event: Event): void { this.selectedId.set(id); this.renameModel.set({ name }); this.renameError.set(false); this.trigger = event.currentTarget as HTMLElement; this.renameDialog()?.nativeElement.showModal(); queueMicrotask(() => this.renameDialog()?.nativeElement.querySelector('input')?.focus()); }
  protected closeRename(event?: Event): void { event?.preventDefault(); if (this.store.pending()) return; this.renameDialog()?.nativeElement.close(); const trigger = this.trigger; this.trigger = null; queueMicrotask(() => trigger?.focus()); }
  protected async rename(event: Event): Promise<void> { event.preventDefault(); const householdId = this.household.active()?.id; const categoryId = this.selectedId(); const name = this.renameModel().name.trim(); this.renameError.set(!name || name.length > 80); if (!householdId || !categoryId || this.renameError()) return; if (await this.store.rename(householdId, categoryId, name)) { this.closeRename(); this.notify('expenseCategories.renamed'); } }
  protected async archive(id: string, name: string): Promise<void> { const householdId = this.household.active()?.id; if (!householdId) return; const confirmed = await this.confirms.open({ title: this.translate.instant('expenseCategories.archiveTitle'), message: this.translate.instant('expenseCategories.archiveMessage', { name }), confirmLabel: this.translate.instant('expenseCategories.archive'), cancelLabel: this.translate.instant('common.cancel'), variant: 'destructive' }); if (confirmed && await this.store.archive(householdId, id)) this.notify('expenseCategories.archived'); }
  private notify(key: string): void { this.notifications.show({ id: key, tone: 'positive', message: this.translate.instant(key), durationMs: 4000 }); }
}
