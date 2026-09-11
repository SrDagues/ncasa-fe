import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import es from '../../../../../public/i18n/es.json';
import { LanguageService } from '../../../core/i18n/language.service';
import { InboxNotification, NotificationAmount } from '../domain/inbox-notification';
import { NotificationListItemComponent } from './notification-list-item.component';

export const unreadNotification = new InboxNotification({
  id: 'n1', kind: 'EXPENSE_PLAN_ATTENTION_REQUIRED', householdId: 'h1', planId: 'p1', subject: 'Alquiler',
  amount: NotificationAmount.fromDecimal('900.00', 'EUR'), occurrenceDate: '2026-09-10', occurrenceNumber: 2,
  totalOccurrences: 12, attentionReason: 'Selecciona un pagador', occurredAt: '2026-09-04T08:00:00Z',
  createdAt: '2026-09-04T08:00:01Z', readAt: null,
});

describe('NotificationListItemComponent', () => {
  it('renders separate accessible controls for opening and marking read', () => {
    TestBed.configureTestingModule({ imports: [NotificationListItemComponent], providers: [
      provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
      { provide: LanguageService, useValue: { currentLanguage: signal('es') } },
    ] });
    TestBed.inject(TranslateService).setTranslation('es', es);
    const fixture = TestBed.createComponent(NotificationListItemComponent);
    fixture.componentRef.setInput('notification', unreadNotification);
    const open = vi.fn(); const read = vi.fn();
    fixture.componentInstance.openNotification.subscribe(open); fixture.componentInstance.markRead.subscribe(read);
    fixture.detectChanges();

    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(anchor.contains(button)).toBe(false); expect(button.getAttribute('aria-label')).toContain('Alquiler');
    expect(fixture.nativeElement.textContent).toContain('Selecciona un pagador');
    button.click(); expect(read).toHaveBeenCalledWith(unreadNotification); expect(open).not.toHaveBeenCalled();
    anchor.click(); expect(open).toHaveBeenCalledWith(unreadNotification);
  });

  it('renders a completed task as a calendar notification', () => {
    TestBed.configureTestingModule({ imports: [NotificationListItemComponent], providers: [
      provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
      { provide: LanguageService, useValue: { currentLanguage: signal('es') } },
    ] });
    TestBed.inject(TranslateService).setTranslation('es', es);
    const fixture = TestBed.createComponent(NotificationListItemComponent);
    fixture.componentRef.setInput('notification', new InboxNotification({ ...unreadNotification,
      kind: 'CALENDAR_TASK_COMPLETED', planId: null, calendarEntryId: 'task-1', amount: null,
      occurrenceNumber: null, totalOccurrences: null, attentionReason: null, completedByMemberId: 'member-1' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tarea completada');
    expect(fixture.nativeElement.textContent).not.toContain('Cuota');
    expect((fixture.nativeElement.querySelector('a') as HTMLAnchorElement).getAttribute('href')).toContain('/app/calendar/task-1');
  });
});
