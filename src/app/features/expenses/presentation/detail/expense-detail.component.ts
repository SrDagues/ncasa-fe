import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LocalizedCurrencyPipe, LocalizedDatePipe } from '../../../../core/i18n/localized-format.pipe';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { HouseholdStore } from '../../../household';
import { ExpenseDetailStore } from './expense-detail.store';

@Component({ selector: 'app-expense-detail', standalone: true,
  imports: [RouterLink, TranslatePipe, LocalizedCurrencyPipe, LocalizedDatePipe, ButtonComponent, CardComponent, EmptyStateComponent, IconComponent],
  templateUrl: './expense-detail.component.html' })
export class ExpenseDetailComponent {
  protected readonly household = inject(HouseholdStore);
  protected readonly store = inject(ExpenseDetailStore);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly notifications = inject(NotificationService);
  private readonly expenseId = this.route.snapshot.paramMap.get('expenseId') ?? '';
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('voidDialog');
  private readonly categoryDialog = viewChild<ElementRef<HTMLDialogElement>>('categoryDialog');
  private trigger: HTMLElement | null = null;
  protected readonly reason = signal('');
  protected readonly reasonError = signal(false);
  protected readonly permissionDenied = signal(false);
  protected readonly categoryId=signal('');protected readonly classificationReason=signal('');
  protected readonly canVoid = computed(() => {
    const expense = this.store.expense(); const active = this.household.active();
    const summary = this.household.households().find(item => item.id === active?.id);
    return !this.permissionDenied() && expense?.status === 'CONFIRMED'
      && (expense.createdByMemberId === summary?.currentMemberId || summary?.currentRole === 'ADMIN');
  });
  protected readonly canReclassify = computed(() => {
    const expense = this.store.expense(); const active = this.household.active();
    const summary = this.household.households().find(item => item.id === active?.id);
    return expense?.createdByMemberId === summary?.currentMemberId || summary?.currentRole === 'ADMIN';
  });

  constructor() { effect(() => { const id = this.household.active()?.id; if (id && this.expenseId) void this.store.load(id, this.expenseId); }); }

  protected memberName(id: string): string { return this.household.active()?.members.find(member => member.id === id)?.email ?? `${id.slice(0, 8)}…`; }
  protected categoryName(id:string|null):string{return id?this.store.categories().find(item=>item.id===id)?.name??`${id.slice(0,8)}…`:this.translate.instant('expenseCategories.uncategorized');}
  protected retry(): void { const id = this.household.active()?.id; if (id) void this.store.load(id, this.expenseId); }
  protected openVoid(event: Event): void {
    this.trigger = event.currentTarget as HTMLElement; this.reason.set(''); this.reasonError.set(false);
    const dialog = this.dialog()?.nativeElement; if (dialog) { dialog.showModal(); queueMicrotask(() => dialog.querySelector<HTMLTextAreaElement>('textarea')?.focus()); }
  }
  protected openCategory(event:Event):void{this.trigger=event.currentTarget as HTMLElement;this.categoryId.set(this.store.expense()?.categoryId??'');this.classificationReason.set('');this.categoryDialog()?.nativeElement.showModal();queueMicrotask(()=>this.categoryDialog()?.nativeElement.querySelector('select')?.focus());}
  protected closeCategory(event?:Event):void{event?.preventDefault();if(this.store.pending())return;this.categoryDialog()?.nativeElement.close();const trigger=this.trigger;this.trigger=null;queueMicrotask(()=>trigger?.focus());}
  protected async confirmCategory():Promise<void>{const householdId=this.household.active()?.id;if(!householdId||this.classificationReason().trim().length>500)return;if(await this.store.reclassify(householdId,this.expenseId,this.categoryId()||null,this.classificationReason())){this.closeCategory();this.notifications.show({id:'expense-reclassified',tone:'positive',message:this.translate.instant('expenseCategories.reclassified'),durationMs:4000});}}
  protected cancelVoid(event?: Event): void { event?.preventDefault(); if (this.store.pending()) return; this.closeDialog(); }
  protected backdrop(event: MouseEvent): void { if (event.target === event.currentTarget) this.cancelVoid(); }
  protected async confirmVoid(): Promise<void> {
    const reason = this.reason().trim(); this.reasonError.set(reason.length < 1 || reason.length > 500);
    const householdId = this.household.active()?.id;
    if (this.reasonError() || !householdId) return;
    const succeeded = await this.store.void(householdId, this.expenseId, reason);
    if (succeeded) {
      this.closeDialog(); this.notifications.show({ id: 'expense-voided', tone: 'positive', message: this.translate.instant('expenses.notifications.voided'), durationMs: 5000 });
    } else if (this.store.error()?.kind === 'forbidden') { this.permissionDenied.set(true); this.closeDialog(); }
  }
  private closeDialog(): void {
    this.dialog()?.nativeElement.close(); const trigger = this.trigger; this.trigger = null; queueMicrotask(() => trigger?.focus());
  }
}
