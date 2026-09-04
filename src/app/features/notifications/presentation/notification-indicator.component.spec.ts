import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import es from '../../../../../public/i18n/es.json';
import { LanguageService } from '../../../core/i18n/language.service';
import { NotificationIndicatorComponent } from './notification-indicator.component';
import { NotificationInboxStore } from './notification-inbox.store';
import { NotificationTargetCoordinator } from './notification-target.coordinator';

describe('NotificationIndicatorComponent', () => {
  it('shows an exact accessible count, caps the visual badge and loads the preview when opened', () => {
    const store = {
      unreadCount: signal(120), countState: signal('ready'), preview: signal(null), previewState: signal('empty'),
      previewError: signal(null), pendingIds: signal(new Set<string>()), markAllPending: signal(false),
      initialize: vi.fn(), loadUnreadCount: vi.fn(), loadPreview: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn(),
    };
    TestBed.configureTestingModule({ imports: [NotificationIndicatorComponent], providers: [
      provideRouter([]), provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
      { provide: LanguageService, useValue: { currentLanguage: signal('es') } },
      { provide: NotificationInboxStore, useValue: store },
      { provide: NotificationTargetCoordinator, useValue: { open: vi.fn(), notifyReadFailure: vi.fn(), notifyMarkAllFailure: vi.fn() } },
    ] });
    TestBed.inject(TranslateService).setTranslation('es', es);
    const fixture = TestBed.createComponent(NotificationIndicatorComponent); fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-label')).toContain('120'); expect(fixture.nativeElement.textContent).toContain('99+');
    trigger.click(); fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true'); expect(store.loadPreview).toHaveBeenCalledTimes(1);
    expect(store.loadUnreadCount).toHaveBeenCalledTimes(1);
  });
});
