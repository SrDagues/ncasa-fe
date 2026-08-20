import { Component, computed, effect, inject, signal } from '@angular/core';
import { form, FormField, maxLength } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { NotificationService } from '../../../shared/components/notification/notification.service';
import { HouseholdStore } from '../../household';
import { ExpenseSplitError, Money, MoneyError, splitEqually, validateExactSplit } from '../domain';
import { ExpenseFormStore } from '../presentation/form/expense-form.store';

interface ExpenseFormModel { description: string; amount: string; expenseDate: string; payerMemberId: string; splitType: 'EQUAL' | 'EXACT'; }

@Component({ selector: 'app-expense-form', standalone: true,
  imports: [FormField, RouterLink, TranslatePipe, ButtonComponent, CardComponent, IconComponent],
  templateUrl: './expense-form.component.html' })
export class ExpenseFormComponent {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly notifications = inject(NotificationService);
  protected readonly household = inject(HouseholdStore);
  protected readonly store = inject(ExpenseFormStore);
  private readonly model = signal<ExpenseFormModel>({ description: '', amount: '', expenseDate: localToday(), payerMemberId: '', splitType: 'EQUAL' });
  protected readonly expenseForm = form(this.model, schema => { maxLength(schema.description, 240); });
  protected readonly included = signal<ReadonlySet<string>>(new Set());
  protected readonly exactAmounts = signal<Readonly<Record<string, string>>>({});
  protected readonly errors = signal<Readonly<Record<string, string>>>({});
  protected readonly members = this.household.members;
  protected readonly preview = computed(() => {
    try { return splitEqually(Money.fromDecimal(this.model().amount, 'EUR'), [...this.included()]); } catch { return []; }
  });
  protected readonly exactBalance = computed(() => {
    try {
      const total = Money.fromDecimal(this.model().amount, 'EUR');
      let assigned = Money.fromMinorUnits(0n, 'EUR');
      for (const id of this.included()) assigned = assigned.add(Money.fromDecimal(this.exactAmounts()[id] ?? '0', 'EUR'));
      return total.minorUnits - assigned.minorUnits;
    } catch { return null; }
  });
  protected readonly exactBalanceText = computed(() => this.exactBalance() === null ? '' : Money.fromMinorUnits(this.exactBalance()!, 'EUR').toDecimal());
  protected readonly exactBalanced = computed(() => this.exactBalance() === 0n);
  private initializedHousehold: string | null = null;

  constructor() {
    effect(() => {
      const active = this.household.active();
      if (!active || active.id === this.initializedHousehold) return;
      this.initializedHousehold = active.id;
      const memberIds = active.members.filter(member => member.status === 'ACTIVE').map(member => member.id);
      const summary = this.household.households().find(item => item.id === active.id);
      this.included.set(new Set(memberIds));
      this.model.update(value => ({ ...value, payerMemberId: summary?.currentMemberId ?? memberIds[0] ?? '' }));
    });
  }

  protected toggleMember(id: string, checked: boolean): void {
    const next = new Set(this.included()); checked ? next.add(id) : next.delete(id); this.included.set(next);
  }
  protected setExact(id: string, value: string): void { this.exactAmounts.update(current => ({ ...current, [id]: value })); }
  protected changeSplit(type: 'EQUAL' | 'EXACT'): void {
    this.model.update(value => ({ ...value, splitType: type }));
    if (type === 'EXACT') this.exactAmounts.set(Object.fromEntries(this.preview().map(item => [item.memberId, item.amount.toDecimal()])));
  }
  protected memberName(id: string): string { return this.members().find(member => member.id === id)?.email ?? `${id.slice(0, 8)}…`; }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    const householdId = this.household.active()?.id;
    if (!householdId) return;
    const value = this.model();
    const errors: Record<string, string> = {};
    if (!value.description.trim()) errors['description'] = 'expenses.form.errors.descriptionRequired';
    else if (value.description.trim().length > 240) errors['description'] = 'expenses.form.errors.descriptionLength';
    let amount: Money | null = null;
    try { amount = Money.fromDecimal(value.amount, 'EUR'); if (!amount.isPositive()) throw new MoneyError('positive'); }
    catch { errors['amount'] = 'expenses.form.errors.amount'; }
    if (!value.expenseDate) errors['expenseDate'] = 'expenses.form.errors.date';
    if (!this.members().some(member => member.id === value.payerMemberId)) errors['payerMemberId'] = 'expenses.form.errors.payer';
    if (this.included().size === 0) errors['split'] = 'expenses.form.errors.participants';
    if (amount && value.splitType === 'EXACT') {
      try { validateExactSplit(amount, [...this.included()].map(memberId => ({ memberId, amount: Money.fromDecimal(this.exactAmounts()[memberId] ?? '', 'EUR') }))); }
      catch (error) { errors['split'] = error instanceof ExpenseSplitError ? 'expenses.form.errors.exactTotal' : 'expenses.form.errors.exactAmount'; }
    }
    this.errors.set(errors);
    if (!amount || Object.keys(errors).length) return;
    const split = value.splitType === 'EQUAL' ? { type: 'EQUAL' as const, memberIds: [...this.included()] }
      : { type: 'EXACT' as const, allocations: [...this.included()].map(memberId => ({ memberId, amount: Money.fromDecimal(this.exactAmounts()[memberId], 'EUR') })) };
    const created = await this.store.submit(householdId, { description: value.description, amount, expenseDate: value.expenseDate, payerMemberId: value.payerMemberId, split });
    if (created) {
      this.notifications.show({ id: 'expense-created', tone: 'positive', message: this.translate.instant('expenses.notifications.created'), durationMs: 5000 });
      await this.router.navigate(['/app/expenses', created.id]);
    } else if (this.store.error()) {
      this.errors.update(current => ({ ...current, ...this.store.error()!.fields }));
    }
  }
}

function localToday(): string {
  const now = new Date(); const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
