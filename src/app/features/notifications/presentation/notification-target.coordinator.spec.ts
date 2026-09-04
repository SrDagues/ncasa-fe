import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import { NotificationService } from '../../../shared/components/notification/notification.service';
import { HouseholdStore } from '../../household';
import { InboxNotification, NotificationAmount } from '../domain/inbox-notification';
import { NotificationInboxStore } from './notification-inbox.store';
import { NotificationTargetCoordinator } from './notification-target.coordinator';

const unreadNotification = new InboxNotification({
  id: 'n1', kind: 'EXPENSE_PLAN_ATTENTION_REQUIRED', householdId: 'h1', planId: 'p1', subject: 'Alquiler',
  amount: NotificationAmount.fromDecimal('900.00', 'EUR'), occurrenceDate: '2026-09-10', occurrenceNumber: 2,
  totalOccurrences: 12, attentionReason: 'Selecciona un pagador', occurredAt: '2026-09-04T08:00:00Z',
  createdAt: '2026-09-04T08:00:01Z', readAt: null,
});

describe('NotificationTargetCoordinator', () => {
  it('marks read, selects the target household and navigates to the plan', async () => {
    const active = signal<{ id: string } | null>({ id: 'other' });
    const select = vi.fn(async (id: string) => active.set({ id })); const markRead = vi.fn(async () => true);
    const navigate = vi.fn(async () => true);
    TestBed.configureTestingModule({ providers: [NotificationTargetCoordinator,
      { provide: NotificationInboxStore, useValue: { markRead } }, { provide: HouseholdStore, useValue: { active, select } },
      { provide: Router, useValue: { navigate } }, { provide: NotificationService, useValue: { show: vi.fn() } },
      { provide: TranslateService, useValue: { instant: (key: string) => key } },
    ] });
    expect(await TestBed.inject(NotificationTargetCoordinator).open(unreadNotification)).toBe(true);
    expect(markRead).toHaveBeenCalled(); expect(select).toHaveBeenCalledWith('h1');
    expect(navigate).toHaveBeenCalledWith(['/app/expenses/plans', 'p1']);
  });

  it('navigates despite a read failure and reports it', async () => {
    const show = vi.fn(); const navigate = vi.fn(async () => true);
    TestBed.configureTestingModule({ providers: [NotificationTargetCoordinator,
      { provide: NotificationInboxStore, useValue: { markRead: vi.fn(async () => false) } },
      { provide: HouseholdStore, useValue: { active: signal({ id: 'h1' }), select: vi.fn() } },
      { provide: Router, useValue: { navigate } }, { provide: NotificationService, useValue: { show } },
      { provide: TranslateService, useValue: { instant: (key: string) => key } },
    ] });
    expect(await TestBed.inject(NotificationTargetCoordinator).open(unreadNotification)).toBe(true);
    await vi.waitFor(() => expect(show).toHaveBeenCalled()); expect(navigate).toHaveBeenCalled();
  });

  it('does not navigate when the household cannot be activated', async () => {
    const navigate = vi.fn(); const show = vi.fn();
    TestBed.configureTestingModule({ providers: [NotificationTargetCoordinator,
      { provide: NotificationInboxStore, useValue: { markRead: vi.fn(async () => true) } },
      { provide: HouseholdStore, useValue: { active: signal({ id: 'other' }), select: vi.fn(async () => undefined) } },
      { provide: Router, useValue: { navigate } }, { provide: NotificationService, useValue: { show } },
      { provide: TranslateService, useValue: { instant: (key: string) => key } },
    ] });
    expect(await TestBed.inject(NotificationTargetCoordinator).open(unreadNotification)).toBe(false);
    expect(navigate).not.toHaveBeenCalled(); expect(show).toHaveBeenCalled();
  });
});
