import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { HouseholdStore } from '../../../household';

export type ExpenseSection = 'history' | 'drafts' | 'plans' | 'balances' | 'settlements' | 'categories';

@Component({
  selector: 'app-expenses-section-nav',
  imports: [RouterLink, TranslatePipe],
  template: `<nav class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" [attr.aria-label]="'expenseSections.label' | translate">
    @for (item of items(); track item.section) {
      <a [routerLink]="item.link" [attr.aria-current]="current() === item.section ? 'page' : null"
        class="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ncasa-forest"
        [class.bg-ncasa-forest]="current() === item.section" [class.text-ncasa-cream]="current() === item.section">
        {{ item.key | translate }}
      </a>
    }
  </nav>`,
})
export class ExpensesSectionNavComponent {
  readonly current = input.required<ExpenseSection>();
  private readonly household = inject(HouseholdStore);
  protected readonly items = computed(() => {
    const active = this.household.active();
    const summary = this.household.households().find(item => item.id === active?.id);
    const items = [
      { section: 'history' as const, link: '/app/expenses', key: 'expenseSections.history' },
      { section: 'drafts' as const, link: '/app/expenses/drafts', key: 'expenseSections.drafts' },
      { section: 'plans' as const, link: '/app/expenses/plans', key: 'expenseSections.plans' },
      { section: 'balances' as const, link: '/app/expenses/balances', key: 'expenseSections.balances' },
      { section: 'settlements' as const, link: '/app/expenses/settlements', key: 'expenseSections.settlements' },
    ];
    return summary?.currentRole === 'ADMIN' ? [...items, { section: 'categories' as const, link: '/app/expenses/categories', key: 'expenseSections.categories' }] : items;
  });
}
