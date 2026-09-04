import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LocalizedCurrencyPipe, LocalizedDatePipe } from '../../../../core/i18n/localized-format.pipe';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { HouseholdStore } from '../../../household';
import { ExpensePlanDetailStore } from './expense-plan.stores';
@Component({selector:'app-expense-plan-detail',imports:[RouterLink,TranslatePipe,LocalizedCurrencyPipe,LocalizedDatePipe,ButtonComponent,CardComponent,EmptyStateComponent],templateUrl:'./expense-plan-detail.component.html'})
export class ExpensePlanDetailComponent{
 protected readonly household=inject(HouseholdStore);protected readonly store=inject(ExpensePlanDetailStore);private readonly route=inject(ActivatedRoute);private readonly confirms=inject(ConfirmDialogService);private readonly notifications=inject(NotificationService);private readonly translate=inject(TranslateService);private readonly id=this.route.snapshot.paramMap.get('planId')??'';private readonly lifecycleDialog=viewChild<ElementRef<HTMLDialogElement>>('lifecycleDialog');private trigger:HTMLElement|null=null;
 protected readonly reason=signal('');protected readonly reasonError=signal(false);protected readonly lifecycleAction=signal<'pause'|'cancel'>('pause');
 protected readonly canManage=computed(()=>{const p=this.store.plan(),h=this.household.active(),s=this.household.households().find(x=>x.id===h?.id);return Boolean(p&&(p.createdByMemberId===s?.currentMemberId||s?.currentRole==='ADMIN'));});
 constructor(){effect(()=>{const h=this.household.active()?.id;if(h)void this.store.load(h,this.id);});}
 protected memberName(id:string){return this.household.active()?.members.find(m=>m.id===id)?.email??`${id.slice(0,8)}…`;}protected categoryName(id:string|null){return id?this.store.categories().find(c=>c.id===id)?.name??id.slice(0,8):this.translate.instant('expenseCategories.uncategorized');}protected retry(){const h=this.household.active()?.id;if(h)void this.store.load(h,this.id);}
 protected openLifecycle(action:'pause'|'cancel',event:Event){this.trigger=event.currentTarget as HTMLElement;this.lifecycleAction.set(action);this.reason.set('');this.reasonError.set(false);this.lifecycleDialog()?.nativeElement.showModal();queueMicrotask(()=>this.lifecycleDialog()?.nativeElement.querySelector('textarea')?.focus());}
 protected pause(){this.openFromFocused('pause');}protected cancel(){this.openFromFocused('cancel');}
 protected closeLifecycle(event?:Event){event?.preventDefault();if(this.store.pending())return;this.lifecycleDialog()?.nativeElement.close();const trigger=this.trigger;this.trigger=null;queueMicrotask(()=>trigger?.focus());}
 protected async confirmLifecycle(){const h=this.household.active()?.id,reason=this.reason().trim(),action=this.lifecycleAction();this.reasonError.set(reason.length>500||(action==='cancel'&&!reason));if(!h||this.reasonError())return;const ok=action==='pause'?await this.store.pause(h,reason||undefined):await this.store.cancel(h,reason);if(ok){this.closeLifecycle();this.notify(action==='pause'?'expensePlans.paused':'expensePlans.cancelled');}else if(this.store.error()?.kind==='conflict'){this.closeLifecycle();this.retry();}}
 protected async reactivate(){const h=this.household.active()?.id;if(!h)return;if(await this.confirms.open({title:this.translate.instant('expensePlans.reactivate'),message:this.translate.instant('expensePlans.reactivateConfirm'),confirmLabel:this.translate.instant('expensePlans.reactivate'),cancelLabel:this.translate.instant('common.cancel')})&&await this.store.reactivate(h))this.notify('expensePlans.reactivated');else if(this.store.error()?.kind==='conflict')this.retry();}
 private notify(key:string){this.notifications.show({id:key,tone:'positive',message:this.translate.instant(key),durationMs:4000});}
 private openFromFocused(action:'pause'|'cancel'){this.trigger=document.activeElement as HTMLElement;this.lifecycleAction.set(action);this.reason.set('');this.reasonError.set(false);this.lifecycleDialog()?.nativeElement.showModal();queueMicrotask(()=>this.lifecycleDialog()?.nativeElement.querySelector('textarea')?.focus());}
}
