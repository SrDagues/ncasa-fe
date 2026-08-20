import { Component, computed, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthStore } from '../auth';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { canRemoveMember } from './domain/household-capabilities';
import { HouseholdMember, HouseholdRole } from './domain/household.models';
import { HouseholdStore } from './presentation/household.store';

@Component({
  selector: 'app-household',
  imports: [TranslatePipe, AlertComponent, AvatarComponent, BadgeComponent, ButtonComponent, CardComponent, IconComponent],
  templateUrl: './household.component.html',
})
export class HouseholdComponent {
  protected readonly store = inject(HouseholdStore);
  private readonly auth = inject(AuthStore);
  private readonly translate = inject(TranslateService);
  protected createName = '';
  protected renameValue = '';
  protected inviteEmail = '';
  protected inviteRole: HouseholdRole = 'MEMBER';
  protected showCreateForm = false;
  protected readonly accountId = computed(() => this.auth.currentUser()?.id ?? null);

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
  protected async rename(): Promise<void> {
    if (!this.renameValue.trim()) return;
    if (await this.store.rename(this.renameValue)) this.renameValue = '';
  }
  protected async invite(): Promise<void> {
    if (!this.inviteEmail.trim()) return;
    if (await this.store.invite(this.inviteEmail, this.inviteRole)) this.inviteEmail = '';
  }
  protected async accept(id: string): Promise<void> { await this.store.acceptInvitation(id); }
  protected async cancel(id: string): Promise<void> { if (this.confirm('cancelInvite')) await this.store.cancelInvitation(id); }
  protected async toggleRole(member: HouseholdMember): Promise<void> {
    const role: HouseholdRole = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    if (this.confirm('changeRole')) await this.store.changeRole(member.id, role);
  }
  protected async transfer(member: HouseholdMember): Promise<void> {
    if (this.confirm('transfer')) await this.store.transferOwnership(member.id);
  }
  protected async remove(member: HouseholdMember): Promise<void> {
    if (this.confirm('remove')) await this.store.removeMember(member.id);
  }
  protected async leave(): Promise<void> { if (this.confirm('leave')) await this.store.leave(); }
  protected async archive(): Promise<void> { if (this.confirm('archive')) await this.store.archive(); }
  private confirm(action: string): boolean { return globalThis.confirm(this.translate.instant(`householdConfirm.${action}`)); }
}
