import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { FilterChipComponent } from '../../../shared/components/filter-chip/filter-chip.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { CATEGORIES, EXPENSES } from '../../../core/demo-content';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    CardComponent,
    BadgeComponent,
    ButtonComponent,
    FilterChipComponent,
    EmptyStateComponent,
  ],
  templateUrl: './expense-list.component.html',
})
export class ExpenseListComponent {
  readonly expenses = EXPENSES;

  readonly filters = [
    { key: 'todos', label: 'Todos' },
    { key: 'pendiente', label: 'Pendientes' },
    { key: 'repartido', label: 'Repartidos' },
    { key: 'liquidado', label: 'Liquidados' },
  ];

  activeFilter = 'todos';

  setFilter(key: string) {
    this.activeFilter = key;
  }

  get filtered() {
    if (this.activeFilter === 'todos') return this.expenses;
    return this.expenses.filter((e) => e.status === this.activeFilter);
  }

  get totalFiltered(): number {
    return this.filtered.reduce((s, e) => s + e.amount, 0);
  }

  categoryIcon(key: string): string {
    return CATEGORIES.find((c) => c.key === key)?.icon ?? 'tag';
  }

  categoryLabel(key: string): string {
    return CATEGORIES.find((c) => c.key === key)?.label ?? 'Otros';
  }

  statusTone(status: string): 'positive' | 'warning' | 'neutral' {
    if (status === 'liquidado') return 'positive';
    if (status === 'pendiente') return 'warning';
    return 'neutral';
  }

  trackExpense(_: number, e: any): string {
    return e.id;
  }
}
