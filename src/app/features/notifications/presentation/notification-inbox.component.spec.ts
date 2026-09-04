import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import es from '../../../../../public/i18n/es.json';
import { NotificationInboxComponent } from './notification-inbox.component';
import { NotificationInboxStore } from './notification-inbox.store';
import { NotificationTargetCoordinator } from './notification-target.coordinator';

describe('NotificationInboxComponent', () => {
  it('loads all notifications by default and resets to page zero when filtering unread items', () => {
    const loadPage = vi.fn(); const setUnreadOnly = vi.fn();
    const store = {
      unreadCount: signal(0), page: signal(null), pageState: signal('empty'), pageError: signal(null),
      unreadOnly: signal(false), pendingIds: signal(new Set<string>()), markAllPending: signal(false),
      loadPage, loadUnreadCount: vi.fn(), setUnreadOnly, markRead: vi.fn(), markAllRead: vi.fn(),
    };
    TestBed.configureTestingModule({ imports: [NotificationInboxComponent], providers: [
      provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
      { provide: NotificationInboxStore, useValue: store },
      { provide: NotificationTargetCoordinator, useValue: { open: vi.fn(), notifyReadFailure: vi.fn(), notifyMarkAllFailure: vi.fn() } },
    ] });
    TestBed.inject(TranslateService).setTranslation('es', es);
    const fixture = TestBed.createComponent(NotificationInboxComponent); fixture.detectChanges();
    expect(loadPage).toHaveBeenCalledWith(0, false);
    const unread = [...fixture.nativeElement.querySelectorAll('button')]
      .find((button: HTMLButtonElement) => button.textContent?.includes('Solo no leídas')) as HTMLButtonElement;
    unread.click(); expect(setUnreadOnly).toHaveBeenCalledWith(true);
  });
});
