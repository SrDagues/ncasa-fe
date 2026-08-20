import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SelectComponent } from '../../../shared/components/select/select.component';
import { CheckboxComponent } from '../../../shared/components/checkbox/checkbox.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { CATEGORIES } from '..';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { HouseholdStore } from '../../household';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    CardComponent,
    ButtonComponent,
    FormFieldComponent,
    InputComponent,
    SelectComponent,
    CheckboxComponent,
    AlertComponent,
    TranslatePipe,
  ],
  templateUrl: './expense-form.component.html',
})
export class ExpenseFormComponent {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly household = inject(HouseholdStore);
  readonly isTicketMode: boolean;
  readonly members = this.household.members;

  concept = '';
  amount = '';
  category = 'supermercado';
  paidBy = 'm1';
  date = '';
  splitType = 'igual';
  includedIds = new Set<string>();

  readonly categoryOptions = computed(() => {
    this.translate.currentLang();
    return CATEGORIES.map((c) => ({
      value: c.key,
      label: this.translate.instant(c.labelKey),
    }));
  });

  readonly memberOptions = computed(() => this.members().map((m) => ({ value: m.id, label: m.email ?? `#${m.accountId}` })));

  readonly splitOptions = [
    { key: 'igual', labelKey: 'expenses.form.splitOptions.equal' },
    { key: 'porcentaje', labelKey: 'expenses.form.splitOptions.percentage' },
    { key: 'partes', labelKey: 'expenses.form.splitOptions.shares' },
    { key: 'importe', labelKey: 'expenses.form.splitOptions.exact' },
  ];

  constructor() {
    this.isTicketMode = this.router.url.includes('tickets');
    if (this.isTicketMode) {
      this.concept = 'Compra supermercado';
      this.amount = '48.20';
      this.category = 'supermercado';
    }
    effect(() => {
      const members = this.members();
      this.includedIds = new Set(members.map(member => member.id));
      this.paidBy = members[0]?.id ?? '';
    });
  }

  isIncluded(id: string): boolean {
    return this.includedIds.has(id);
  }

  toggleMember(id: string, checked: boolean) {
    if (checked) this.includedIds.add(id);
    else this.includedIds.delete(id);
  }

  onSubmit(e: Event) {
    e.preventDefault();
    this.router.navigate(['/app/expenses']);
  }
}
