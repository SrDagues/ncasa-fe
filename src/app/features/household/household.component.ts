import { Component, computed, effect, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthStore } from '../auth';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ConfirmDialogService, ConfirmDialogVariant } from '../../shared/components/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../shared/components/notification/notification.service';
import { canRemoveMember } from './domain/household-capabilities';
import { HouseholdMember, HouseholdRole, SentInvitation } from './domain/household.models';
import { HouseholdStore } from './presentation/household.store';

@Component({
  selector: 'app-household',
  imports: [TranslatePipe, AvatarComponent, BadgeComponent, ButtonComponent, CardComponent, IconComponent],
  templateUrl: './household.component.html',
})
export class HouseholdComponent {
  protected readonly store = inject(HouseholdStore);
  private readonly auth = inject(AuthStore);
  private readonly translate = inject(TranslateService);
  private readonly dialogs = inject(ConfirmDialogService);
  private readonly notifications = inject(NotificationService);
  protected createName = '';
  protected renameValue = '';
  protected inviteEmail = '';
  protected inviteRole: HouseholdRole = 'MEMBER';
  protected showCreateForm = false;
  protected readonly accountId = computed(() => this.auth.currentUser()?.id ?? null);
  protected readonly householdListClasses = computed(() => {
    const count = this.store.households().length;
    return [
      'grid divide-y divide-ncasa-border',
      count >= 2 ? 'sm:grid-cols-2 sm:divide-x sm:divide-y-0' : '',
      count >= 3 ? 'lg:grid-cols-3' : '',
    ].join(' ');
  });

  constructor() {
    effect(() => {
      const error = this.store.error();
      if (!error) return;
      const loadFailed = this.store.state() === 'error';
      this.notifications.show({
        id: 'household-error',
        tone: 'error',
        message: this.translate.instant(`household.errors.${error.kind}`),
        durationMs: null,
        action: loadFailed ? { label: this.translate.instant('common.retry'), run: () => void this.store.reload() } : undefined,
      });
      queueMicrotask(() => this.store.clearError(error));
    });
    effect(() => {
      if (!this.store.deliveryWarning()) return;
      this.notifications.show({
        id: 'household-delivery-warning',
        tone: 'warning',
        message: this.translate.instant('householdDeliveryWarning'),
        durationMs: 8_000,
      });
      queueMicrotask(() => this.store.clearDeliveryWarning());
    });
  }

  protected setCreateName(event: Event): void { this.createName = (event.target as HTMLInputElement).value; }
  protected setRenameValue(event: Event): void { this.renameValue = (event.target as HTMLInputElement).value; }
  protected setInviteEmail(event: Event): void { this.inviteEmail = (event.target as HTMLInputElement).value; }
  protected setInviteRole(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'ADMIN' || value === 'MEMBER') this.inviteRole = value;
  }

  protected initials(email: string | null): string { return email ? email.slice(0, 2).toUpperCase() : '?'; }
  protected memberLabel(member: HouseholdMember): string { return member.email ?? '—'; }
  protected canRemove(member: HouseholdMember): boolean {
    const household = this.store.active(); const accountId = this.accountId();
    return household !== null && accountId !== null && canRemoveMember(household, accountId, member);
  }
  protected async create(): Promise<void> {
    if (!this.createName.trim() || this.createName.trim().length > 120) return;
    if (await this.store.create(this.createName)) {
      this.createName = '';
      this.showCreateForm = false;
    }
  }
  protected async selectHousehold(id: string): Promise<void> {
    if (id === this.store.active()?.id) return;
    this.renameValue = '';
    this.inviteEmail = '';
    await this.store.select(id);
  }
  protected async rename(): Promise<void> {
    if (!this.renameValue.trim()) return;
    if (await this.store.rename(this.renameValue)) this.renameValue = '';
  }
  protected async invite(): Promise<void> {
    if (!this.inviteEmail.trim()) return;
    if (await this.store.invite(this.inviteEmail, this.inviteRole)) this.inviteEmail = '';
  }
  protected async accept(id: string): Promise<void> { await this.store.acceptInvitation(id); }
  protected async cancel(invitation: SentInvitation): Promise<void> {
    if (await this.confirm('cancelInvite', { email: invitation.email, household: this.store.active()?.name ?? '' }, 'destructive')) {
      await this.store.cancelInvitation(invitation.id);
    }
  }
  protected async toggleRole(member: HouseholdMember): Promise<void> {
    const role: HouseholdRole = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    const roleLabel = this.translate.instant(`household.roles.${role.toLowerCase()}`);
    if (await this.confirm('changeRole', { member: this.memberLabel(member), role: roleLabel }, 'primary')) await this.store.changeRole(member.id, role);
  }
  protected async transfer(member: HouseholdMember): Promise<void> {
    if (await this.confirm('transfer', { member: this.memberLabel(member), household: this.store.active()?.name ?? '' }, 'primary')) await this.store.transferOwnership(member.id);
  }
  protected async remove(member: HouseholdMember): Promise<void> {
    if (await this.confirm('remove', { member: this.memberLabel(member), household: this.store.active()?.name ?? '' }, 'destructive')) await this.store.removeMember(member.id);
  }
  protected async leave(): Promise<void> {
    if (await this.confirm('leave', { household: this.store.active()?.name ?? '' }, 'destructive')) await this.store.leave();
  }
  protected async archive(): Promise<void> {
    if (await this.confirm('archive', { household: this.store.active()?.name ?? '' }, 'destructive')) await this.store.archive();
  }
  private confirm(action: string, params: Record<string, string>, variant: ConfirmDialogVariant): Promise<boolean> {
    if (this.store.pendingOperation()) return Promise.resolve(false);
    return this.dialogs.open({
      title: this.translate.instant(`household.confirmations.${action}.title`),
      message: this.translate.instant(`household.confirmations.${action}.message`, params),
      confirmLabel: this.translate.instant(`household.confirmations.${action}.confirm`),
      cancelLabel: this.translate.instant('common.cancel'),
      variant,
    });
  }
}
