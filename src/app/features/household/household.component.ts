import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { FormFieldComponent } from '../../shared/components/form-field/form-field.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { SelectComponent } from '../../shared/components/select/select.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LocalizedCurrencyPipe } from '../../core/i18n/localized-format.pipe';
import {
  HOUSEHOLD_NAME,
  MEMBERS,
  PENDING_INVITES,
} from '../../core/demo-content';

@Component({
  selector: 'app-household',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    AvatarComponent,
    FormFieldComponent,
    InputComponent,
    SelectComponent,
    TranslatePipe,
    LocalizedCurrencyPipe,
  ],
  templateUrl: './household.component.html',
})
export class HouseholdComponent {
  private readonly translate = inject(TranslateService);
  readonly household = HOUSEHOLD_NAME;
  readonly members = MEMBERS;
  readonly invites = PENDING_INVITES;

  inviteEmail = '';
  inviteRole = 'member';

  readonly roleOptions = computed(() => {
    this.translate.currentLang();
    return [
      { value: 'member', label: this.translate.instant('household.roles.member') },
      { value: 'admin', label: this.translate.instant('household.roles.admin') },
    ];
  });

  /** Simplified settle-up suggestion derived from balances. */
  readonly settlements = this.computeSettlements();

  private computeSettlements() {
    const creditor = this.members.find((m) => m.balance > 0);
    if (!creditor) return [];
    return this.members
      .filter((m) => m.balance < 0)
      .map((debtor) => ({
        from: debtor,
        to: creditor,
        amount: Math.abs(debtor.balance),
      }));
  }

  absAmount(value: number): number {
    return Math.abs(value);
  }

  onInvite(e: Event) {
    e.preventDefault();
    this.inviteEmail = '';
  }

  trackMember(_: number, m: { id: string }): string {
    return m.id;
  }
}
