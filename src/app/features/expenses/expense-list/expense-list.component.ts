import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedCurrencyPipe, LocalizedDatePipe } from '../../../core/i18n/localized-format.pipe';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { HouseholdStore } from '../../household';
import { ExpenseStatus } from '../domain';
import { ExpenseListStore } from '../presentation/list/expense-list.store';

@Component({ selector: 'app-expense-list', standalone: true,
  imports: [RouterLink, TranslatePipe, LocalizedCurrencyPipe, LocalizedDatePipe, ButtonComponent, CardComponent, EmptyStateComponent, IconComponent],
  templateUrl: './expense-list.component.html' })
export class ExpenseListComponent {
  protected readonly household = inject(HouseholdStore);
  protected readonly store = inject(ExpenseListStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly status = signal<ExpenseStatus>('CONFIRMED');
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly payerMemberId = signal('');
  protected readonly participantMemberId = signal('');
  protected readonly page = signal(0);
  protected readonly dateError = signal(false);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.status.set(params.get('status') === 'VOIDED' ? 'VOIDED' : 'CONFIRMED');
      this.from.set(params.get('from') ?? ''); this.to.set(params.get('to') ?? '');
      this.payerMemberId.set(params.get('payerMemberId') ?? ''); this.participantMemberId.set(params.get('participantMemberId') ?? '');
      this.page.set(Math.max(0, Number(params.get('page')) || 0)); this.reload();
    });
    effect(() => { this.household.active()?.id; this.reload(); });
  }

  protected applyFilters(): void {
    this.dateError.set(Boolean(this.from() && this.to() && this.from() > this.to()));
    if (!this.dateError()) void this.navigate(0);
  }
  protected changeStatus(status: ExpenseStatus): void { this.status.set(status); void this.navigate(0); }
  protected previous(): void { if (this.page() > 0) void this.navigate(this.page() - 1); }
  protected next(): void { if ((this.store.result()?.totalPages ?? 0) > this.page() + 1) void this.navigate(this.page() + 1); }
  protected memberName(id: string): string { return this.household.active()?.members.find(member => member.id === id)?.email ?? `${id.slice(0, 8)}…`; }
  protected reload(): void {
    const householdId = this.household.active()?.id;
    if (!householdId) { this.store.reset(); return; }
    const members = this.household.active()?.members ?? [];
    const payer = members.some(member => member.id === this.payerMemberId()) ? this.payerMemberId() : undefined;
    const participant = members.some(member => member.id === this.participantMemberId()) ? this.participantMemberId() : undefined;
    void this.store.load(householdId, { status: this.status(), from: this.from() || undefined, to: this.to() || undefined, payerMemberId: payer, participantMemberId: participant }, this.page());
  }
  private navigate(page: number): Promise<boolean> {
    return this.router.navigate([], { relativeTo: this.route, queryParams: {
      status: this.status(), from: this.from() || null, to: this.to() || null, page: page || null,
      payerMemberId: this.payerMemberId() || null, participantMemberId: this.participantMemberId() || null,
    }, queryParamsHandling: 'merge' });
  }
}
