import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HouseholdApplicationService } from '../application/household-application.service';
import { HouseholdApplicationError } from '../application/household.errors';
import { ActiveHouseholdStoragePort } from '../application/ports/household.ports';
import { householdCapabilities } from '../domain/household-capabilities';
import { Household, HouseholdId, HouseholdRole, InvitationId, MemberId } from '../domain/household.models';
import { ACTIVE_HOUSEHOLD_STORAGE } from '../infrastructure/storage/active-household-storage.token';

export type HouseholdLoadState = 'initial' | 'loading' | 'empty' | 'ready' | 'error';

@Injectable()
export class HouseholdStore {
  private readonly application = inject(HouseholdApplicationService);
  private readonly storage = inject<ActiveHouseholdStoragePort>(ACTIVE_HOUSEHOLD_STORAGE);
  private readonly stateValue = signal<HouseholdLoadState>('initial');
  private readonly householdsValue = signal<readonly import('../domain/household.models').HouseholdSummary[]>([]);
  private readonly activeValue = signal<Household | null>(null);
  private readonly receivedValue = signal<readonly import('../domain/household.models').ReceivedInvitation[]>([]);
  private readonly sentValue = signal<readonly import('../domain/household.models').SentInvitation[]>([]);
  private readonly errorValue = signal<HouseholdApplicationError | null>(null);
  private readonly pendingValue = signal<string | null>(null);
  private readonly deliveryWarningValue = signal(false);
  private accountId: number | null = null;
  private loadPromise: Promise<void> | null = null;

  readonly state = this.stateValue.asReadonly();
  readonly households = this.householdsValue.asReadonly();
  readonly active = this.activeValue.asReadonly();
  readonly receivedInvitations = this.receivedValue.asReadonly();
  readonly sentInvitations = this.sentValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly pendingOperation = this.pendingValue.asReadonly();
  readonly deliveryWarning = this.deliveryWarningValue.asReadonly();
  readonly members = computed(() => this.activeValue()?.members.filter(member => member.status === 'ACTIVE') ?? []);
  readonly capabilities = computed(() => householdCapabilities(this.activeValue(), this.accountId));

  initialize(accountId: number): Promise<void> {
    if (this.accountId === accountId && this.stateValue() !== 'initial') return this.loadPromise ?? Promise.resolve();
    this.accountId = accountId;
    return this.reload();
  }

  reload(): Promise<void> {
    if (this.accountId === null) return Promise.resolve();
    if (this.loadPromise) return this.loadPromise;
    this.stateValue.set('loading');
    this.errorValue.set(null);
    this.loadPromise = Promise.all([firstValueFrom(this.application.list()), firstValueFrom(this.application.listReceived())])
      .then(async ([households, invitations]) => {
        this.householdsValue.set(households);
        this.receivedValue.set(invitations);
        if (households.length === 0) {
          this.activeValue.set(null); this.sentValue.set([]); this.stateValue.set('empty'); return;
        }
        const saved = this.storage.read(this.accountId!);
        const selected = households.find(item => item.id === saved) ?? households[0];
        await this.select(selected.id);
      })
      .catch(error => { this.errorValue.set(this.asError(error)); this.stateValue.set('error'); })
      .finally(() => { this.loadPromise = null; });
    return this.loadPromise;
  }

  async select(id: HouseholdId): Promise<void> {
    if (this.accountId === null) return;
    this.pendingValue.set('select');
    try {
      const household = await firstValueFrom(this.application.get(id));
      this.activeValue.set(household);
      this.storage.write(this.accountId, id);
      this.stateValue.set('ready');
      const member = household.members.find(item => item.accountId === this.accountId && item.status === 'ACTIVE');
      this.sentValue.set(member?.role === 'ADMIN' ? await firstValueFrom(this.application.listSent(id)) : []);
    } catch (error) { this.fail(error); }
    finally { this.pendingValue.set(null); }
  }

  async create(name: string): Promise<boolean> {
    return this.mutate('create', async () => {
      const household = await firstValueFrom(this.application.create(name));
      await this.refreshAndSelect(household.id);
    });
  }
  async rename(name: string): Promise<boolean> {
    const id = this.requireActive(); if (!id) return false;
    return this.mutate('rename', async () => this.activeValue.set(await firstValueFrom(this.application.rename(id, name))));
  }
  async invite(email: string, role: HouseholdRole): Promise<boolean> {
    const id = this.requireActive(); if (!id) return false;
    return this.mutate('invite', async () => {
      const result = await firstValueFrom(this.application.invite(id, email, role));
      this.deliveryWarningValue.set(!result.deliverySucceeded);
      await this.reloadSent(id);
    });
  }
  async cancelInvitation(invitationId: InvitationId): Promise<boolean> {
    const id = this.requireActive(); if (!id) return false;
    return this.mutate(`cancel:${invitationId}`, async () => { await firstValueFrom(this.application.cancel(id, invitationId)); await this.reloadSent(id); });
  }
  async acceptInvitation(invitationId: InvitationId): Promise<boolean> {
    return this.mutate(`accept:${invitationId}`, async () => {
      const household = await firstValueFrom(this.application.accept(invitationId)); await this.refreshAndSelect(household.id);
    });
  }
  async changeRole(memberId: MemberId, role: HouseholdRole): Promise<boolean> {
    const id = this.requireActive(); if (!id) return false;
    return this.mutate(`role:${memberId}`, async () => this.activeValue.set(await firstValueFrom(this.application.changeRole(id, memberId, role))));
  }
  async transferOwnership(memberId: MemberId): Promise<boolean> {
    const id = this.requireActive(); if (!id) return false;
    return this.mutate(`transfer:${memberId}`, async () => this.activeValue.set(await firstValueFrom(this.application.transferOwnership(id, memberId))));
  }
  async removeMember(memberId: MemberId): Promise<boolean> {
    const id = this.requireActive(); if (!id) return false;
    return this.mutate(`remove:${memberId}`, async () => { await firstValueFrom(this.application.removeMember(id, memberId)); await this.select(id); });
  }
  async leave(): Promise<boolean> { const id = this.requireActive(); return id ? this.removeCurrent('leave', () => firstValueFrom(this.application.leave(id))) : false; }
  async archive(): Promise<boolean> { const id = this.requireActive(); return id ? this.removeCurrent('archive', () => firstValueFrom(this.application.archive(id))) : false; }

  reset(): void {
    this.accountId = null; this.householdsValue.set([]); this.activeValue.set(null); this.receivedValue.set([]);
    this.sentValue.set([]); this.errorValue.set(null); this.stateValue.set('initial');
    this.deliveryWarningValue.set(false);
  }

  private async mutate(operation: string, action: () => Promise<void>): Promise<boolean> {
    if (this.pendingValue()) return false;
    this.pendingValue.set(operation); this.errorValue.set(null);
    try { await action(); return true; }
    catch (error) {
      const failure = this.asError(error);
      this.errorValue.set(failure);
      const activeId = this.activeValue()?.id;
      if (activeId && (failure.kind === 'forbidden' || failure.kind === 'conflict')) {
        try { this.activeValue.set(await firstValueFrom(this.application.get(activeId))); } catch { /* keep recoverable error */ }
      }
      return false;
    }
    finally { this.pendingValue.set(null); }
  }
  private async removeCurrent(operation: string, action: () => Promise<void>): Promise<boolean> {
    return this.mutate(operation, async () => { await action(); if (this.accountId !== null) this.storage.remove(this.accountId); await this.reloadFresh(); });
  }
  private async refreshAndSelect(id: HouseholdId): Promise<void> {
    const households = await firstValueFrom(this.application.list()); this.householdsValue.set(households); await this.select(id);
    this.receivedValue.set(await firstValueFrom(this.application.listReceived()));
  }
  private async reloadFresh(): Promise<void> { this.loadPromise = null; this.stateValue.set('initial'); await this.reload(); }
  private async reloadSent(id: HouseholdId): Promise<void> { this.sentValue.set(await firstValueFrom(this.application.listSent(id))); }
  private requireActive(): HouseholdId | null { return this.activeValue()?.id ?? null; }
  private fail(error: unknown): void { this.errorValue.set(this.asError(error)); }
  private asError(error: unknown): HouseholdApplicationError {
    return error instanceof HouseholdApplicationError ? error : new HouseholdApplicationError('unexpected', 'Unexpected error');
  }
}
