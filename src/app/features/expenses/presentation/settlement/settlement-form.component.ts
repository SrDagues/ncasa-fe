import { Component, computed, effect, inject, signal } from '@angular/core';
import { form, FormField, maxLength } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { HouseholdStore } from '../../../household';
import { CurrentMemberPosition, Money, validateSettlement } from '../../domain';
import { SettlementFormStore } from './settlement.stores';

interface Model { currency: string; fromMemberId: string; toMemberId: string; amount: string; settlementDate: string; note: string; }
@Component({ selector: 'app-settlement-form', imports: [FormField, RouterLink, TranslatePipe, ButtonComponent, CardComponent], templateUrl: './settlement-form.component.html' })
export class SettlementFormComponent {
  protected readonly household = inject(HouseholdStore); protected readonly store = inject(SettlementFormStore);
  private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); private readonly notifications = inject(NotificationService); private readonly translate = inject(TranslateService);
  private readonly model = signal<Model>({ currency: '', fromMemberId: '', toMemberId: '', amount: '', settlementDate: localToday(), note: '' });
  protected readonly settlementForm = form(this.model, schema => maxLength(schema.note, 240)); protected readonly errors = signal<Readonly<Record<string, string>>>({});
  private idempotencyKey = crypto.randomUUID(); private attempted = false; private initialized = false;
  protected readonly currency = computed(() => this.store.debt()?.currencies.find(item => item.currency === this.model().currency));
  protected readonly debtors = computed(() => { const members = this.currency()?.members ?? []; if (this.isAdmin()) return members.filter(member => member.net.isNegative()); const current = members.find(member => member.memberId === this.currentMemberId()); return members.filter(member => member.net.isNegative() && (current?.net.isPositive() || member.memberId === current?.memberId)); });
  protected readonly creditors = computed(() => { const members = this.currency()?.members ?? []; if (this.isAdmin()) return members.filter(member => member.net.isPositive()); const current = members.find(member => member.memberId === this.currentMemberId()); return members.filter(member => member.net.isPositive() && (current?.net.isNegative() || member.memberId === current?.memberId)); });
  constructor() {
    effect(() => { const id = this.household.active()?.id; if (id) void this.store.load(id); });
    effect(() => { const debt = this.store.debt(); if (!debt || this.initialized) return; this.initialized = true; const preset = this.route.snapshot.queryParamMap; const selected = debt.currencies.find(item => item.currency === preset.get('currency')) ?? debt.currencies.find(item => item.suggestedSettlements.length); if (!selected) return; this.model.set({ currency: selected.currency, fromMemberId: preset.get('fromMemberId') ?? this.validDebtor(selected.members), toMemberId: preset.get('toMemberId') ?? this.validCreditor(selected.members), amount: preset.get('amount') ?? '', settlementDate: localToday(), note: '' }); });
  }
  protected memberName(id: string): string { return this.household.active()?.members.find(member => member.id === id)?.email ?? `${id.slice(0, 8)}…`; }
  protected changed(): void { if (this.attempted) { this.idempotencyKey = crypto.randomUUID(); this.attempted = false; } }
  protected async submit(event: Event): Promise<void> {
    event.preventDefault(); const household = this.household.active()?.id; if (!household) return; const value = this.model(); const errors: Record<string, string> = {}; let amount: Money | null = null;
    try { amount = Money.fromDecimal(value.amount, value.currency); const from = this.position(value.fromMemberId); const to = this.position(value.toMemberId); if (!from || !to || (!this.isAdmin() && this.currentMemberId() !== from.memberId && this.currentMemberId() !== to.memberId)) throw new Error(); validateSettlement(amount, from, to); } catch { errors['amount'] = 'settlements.form.invalidTransfer'; }
    if (!value.settlementDate || value.settlementDate > localToday()) errors['settlementDate'] = 'settlements.form.invalidDate'; if (value.note.trim().length > 240) errors['note'] = 'settlements.form.noteLength'; this.errors.set(errors); if (!amount || Object.keys(errors).length) return;
    this.attempted = true; const created = await this.store.submit(household, { idempotencyKey: this.idempotencyKey, fromMemberId: value.fromMemberId, toMemberId: value.toMemberId, amount, settlementDate: value.settlementDate, note: value.note });
    if (created) { this.notifications.show({ id: 'settlement-created', tone: 'positive', message: this.translate.instant('settlements.created'), durationMs: 5000 }); await this.router.navigate(['/app/expenses/settlements', created.id]); } else if (this.store.error()) this.errors.update(current => ({ ...current, ...this.store.error()!.fields }));
  }
  private validDebtor(members: readonly CurrentMemberPosition[]): string { const current = members.find(member => member.memberId === this.currentMemberId()); return (this.isAdmin() || current?.net.isPositive() ? members.find(member => member.net.isNegative()) : current)?.memberId ?? ''; }
  private validCreditor(members: readonly CurrentMemberPosition[]): string { const current = members.find(member => member.memberId === this.currentMemberId()); return (this.isAdmin() || current?.net.isNegative() ? members.find(member => member.net.isPositive()) : current)?.memberId ?? ''; }
  private currentMemberId(): string | undefined { const active = this.household.active(); return this.household.households().find(item => item.id === active?.id)?.currentMemberId; }
  private isAdmin(): boolean { const active = this.household.active(); return this.household.households().find(item => item.id === active?.id)?.currentRole === 'ADMIN'; }
  private position(id: string): CurrentMemberPosition | undefined { return this.currency()?.members.find(member => member.memberId === id); }
}
const localToday = (): string => { const now = new Date(); const offset = now.getTimezoneOffset() * 60_000; return new Date(now.getTime() - offset).toISOString().slice(0, 10); };
