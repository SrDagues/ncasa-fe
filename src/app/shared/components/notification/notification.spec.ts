import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { NotificationHostComponent } from './notification-host.component';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [NotificationHostComponent], providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })] });
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => vi.useRealTimers());

  it('keeps at most the three newest notifications', () => {
    for (let index = 1; index <= 4; index++) service.show({ id: `${index}`, tone: 'error', message: `Error ${index}` });

    expect(service.notifications().map(item => item.id)).toEqual(['2', '3', '4']);
  });

  it('automatically dismisses warnings after eight seconds but keeps errors', () => {
    service.show({ id: 'warning', tone: 'warning', message: 'Warning' });
    service.show({ id: 'error', tone: 'error', message: 'Error' });

    vi.advanceTimersByTime(8_000);

    expect(service.notifications().map(item => item.id)).toEqual(['error']);
  });

  it('renders appropriate live regions and runs an optional action once', () => {
    const action = vi.fn();
    const fixture = TestBed.createComponent(NotificationHostComponent);
    service.show({ id: 'warning', tone: 'warning', message: 'Mail was not delivered' });
    service.show({ id: 'error', tone: 'error', message: 'Could not load', action: { label: 'Retry', run: action } });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.getAttribute('aria-live')).toBe('assertive');
    fixture.nativeElement.querySelector('[data-notification-action]')?.click();

    expect(action).toHaveBeenCalledTimes(1);
    expect(service.notifications().some(item => item.id === 'error')).toBe(false);
  });
});
