import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import es from '../../../../public/i18n/es.json';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../shared/components/notification/notification.service';
import { AuthStore } from '../auth';
import { HouseholdApplicationError } from './application/household.errors';
import { Household, HouseholdMember } from './domain/household.models';
import { HouseholdComponent } from './household.component';
import { HouseholdStore } from './presentation/household.store';

const owner: HouseholdMember = { id: 'owner', accountId: 1, email: 'owner@example.com', role: 'ADMIN', status: 'ACTIVE', owner: true, joinedAt: '', statusChangedAt: '' };
const member: HouseholdMember = { id: 'member', accountId: 2, email: 'member@example.com', role: 'MEMBER', status: 'ACTIVE', owner: false, joinedAt: '', statusChangedAt: '' };
const household: Household = { id: 'h1', name: 'Casa real', status: 'ACTIVE', ownerMemberId: 'owner', createdBy: 1, createdAt: '', members: [owner, member] };
const capabilities = { canRename: true, canInviteMember: true, canInviteAdmin: true, canManageRoles: true, canTransferOwnership: true, canRemoveMembers: true, canLeave: false, canArchive: false };

describe('HouseholdComponent feedback', () => {
  const error = signal<HouseholdApplicationError | null>(null);
  const deliveryWarning = signal(false);
  const removeMember = vi.fn(async () => true);
  const reload = vi.fn(async () => undefined);
  const clearError = vi.fn(() => error.set(null));
  const clearDeliveryWarning = vi.fn(() => deliveryWarning.set(false));
  const open = vi.fn(async () => false);
  const show = vi.fn();
  const store = {
    state: signal('ready'), error, deliveryWarning, receivedInvitations: signal([]), households: signal([{ id: 'h1', name: 'Casa real', status: 'ACTIVE', currentMemberId: 'owner', currentRole: 'ADMIN', owner: true }]),
    active: signal(household), members: signal([owner, member]), sentInvitations: signal([{ id: 'invite', householdId: 'h1', email: 'guest@example.com', role: 'MEMBER' as const, status: 'PENDING' as const, invitedBy: 'owner', createdAt: '', expiresAt: '' }]), pendingOperation: signal<string | null>(null),
    capabilities: signal(capabilities),
    create: vi.fn(), select: vi.fn(), rename: vi.fn(), invite: vi.fn(), acceptInvitation: vi.fn(), cancelInvitation: vi.fn(), changeRole: vi.fn(), transferOwnership: vi.fn(), removeMember, leave: vi.fn(), archive: vi.fn(), reload, clearError, clearDeliveryWarning,
  };

  beforeEach(() => {
    store.state.set('ready');
    store.active.set(household);
    store.capabilities.set(capabilities);
    store.pendingOperation.set(null);
    error.set(null);
    deliveryWarning.set(false);
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [HouseholdComponent],
      providers: [
        provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
        { provide: HouseholdStore, useValue: store },
        { provide: AuthStore, useValue: { currentUser: signal({ id: 1, email: 'owner@example.com', roles: [] }) } },
        { provide: ConfirmDialogService, useValue: { open } },
        { provide: NotificationService, useValue: { show } },
      ],
    });
    TestBed.inject(TranslateService).setTranslation('es', es);
  });

  it('does not remove a member when the contextual dialog is cancelled', async () => {
    const fixture = TestBed.createComponent(HouseholdComponent);
    fixture.detectChanges();

    buttonWithText(fixture.nativeElement, 'Quitar del hogar').click();
    await fixture.whenStable();

    expect(open).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('member@example.com'), variant: 'destructive' }));
    expect(removeMember).not.toHaveBeenCalled();
  });

  it('removes a member only after the dialog is confirmed', async () => {
    open.mockResolvedValueOnce(true);
    const fixture = TestBed.createComponent(HouseholdComponent);
    fixture.detectChanges();

    buttonWithText(fixture.nativeElement, 'Quitar del hogar').click();
    await fixture.whenStable();

    expect(removeMember).toHaveBeenCalledOnce();
    expect(removeMember).toHaveBeenCalledWith('member');
  });

  it('opens contextual dialogs for invitation, role, ownership, leaving, and archiving actions', async () => {
    const fixture = TestBed.createComponent(HouseholdComponent);
    fixture.detectChanges();

    buttonWithText(fixture.nativeElement, 'Cancelar').click();
    await fixture.whenStable();
    expect(open).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Cancelar invitación', message: expect.stringContaining('guest@example.com'), variant: 'destructive' }));

    buttonWithText(fixture.nativeElement, 'Cambiar rol').click();
    await fixture.whenStable();
    expect(open).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Cambiar rol', message: expect.stringContaining('member@example.com'), variant: 'primary' }));

    buttonWithText(fixture.nativeElement, 'Transferir propiedad').click();
    await fixture.whenStable();
    expect(open).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Transferir propiedad', message: expect.stringContaining('Casa real'), variant: 'primary' }));

    store.capabilities.set({ ...capabilities, canLeave: true, canManageRoles: false });
    fixture.detectChanges();
    buttonWithText(fixture.nativeElement, 'Abandonar').click();
    await fixture.whenStable();
    expect(open).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Abandonar hogar', message: expect.stringContaining('Casa real'), variant: 'destructive' }));

    store.capabilities.set({ ...capabilities, canArchive: true });
    fixture.detectChanges();
    buttonWithText(fixture.nativeElement, 'Archivar').click();
    await fixture.whenStable();
    expect(open).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Archivar hogar', message: expect.stringContaining('Casa real'), variant: 'destructive' }));
  });

  it('does not open another dialog while an operation is pending', async () => {
    store.pendingOperation.set('remove:member');
    const fixture = TestBed.createComponent(HouseholdComponent);
    fixture.detectChanges();

    buttonWithText(fixture.nativeElement, 'Quitar del hogar').click();
    await fixture.whenStable();

    expect(open).not.toHaveBeenCalled();
  });

  it('keeps a compact action menu attached to the member identity', () => {
    const fixture = TestBed.createComponent(HouseholdComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const memberRow = [...root.querySelectorAll<HTMLElement>('li')]
      .find(item => item.textContent?.includes('member@example.com'));
    const actions = memberRow?.querySelector<HTMLElement>('[data-member-actions]');

    expect(actions).not.toBeNull();
    expect(actions?.tagName).toBe('DETAILS');
    expect(actions?.querySelector('summary')?.getAttribute('aria-label')).toContain('member@example.com');
    expect(actions?.textContent).toContain('Cambiar rol');
    expect(actions?.textContent).toContain('Quitar del hogar');
  });

  it('publishes one persistent error notification with a retry action for load failures', async () => {
    const fixture = TestBed.createComponent(HouseholdComponent);
    fixture.detectChanges();
    store.state.set('error');
    error.set(new HouseholdApplicationError('network', 'Network error'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(show).toHaveBeenCalledOnce();
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ id: 'household-error', tone: 'error', durationMs: null, action: expect.objectContaining({ label: 'Reintentar' }) }));
    expect(clearError).toHaveBeenCalledOnce();
  });

  it('publishes the delivery failure as a temporary warning', async () => {
    const fixture = TestBed.createComponent(HouseholdComponent);
    fixture.detectChanges();
    deliveryWarning.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(show).toHaveBeenCalledOnce();
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ id: 'household-delivery-warning', tone: 'warning', durationMs: 8_000 }));
    expect(clearDeliveryWarning).toHaveBeenCalledOnce();
  });
});

function buttonWithText(root: HTMLElement, text: string): HTMLElement {
  const button = [...root.querySelectorAll<HTMLElement>('button')].find(item => item.textContent?.includes(text));
  if (!button) throw new Error(`Missing button: ${text}`);
  return button;
}
