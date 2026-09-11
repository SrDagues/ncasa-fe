import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import es from '../../../../public/i18n/es.json';
import { HouseholdStore } from '../household';
import { CalendarComponent } from './calendar.component';
import { CalendarMonthStore } from './presentation/month/calendar-month.store';

describe('CalendarComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CalendarComponent], providers: [
      provideRouter([]), provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
      { provide: HouseholdStore, useValue: { active: signal({ id: 'h1' }) } },
      { provide: CalendarMonthStore, useValue: { occurrences: signal([]), state: signal('empty'), load: vi.fn(async () => undefined) } },
    ] });
    TestBed.inject(TranslateService).setTranslation('es', es);
  });

  it('selects a day when any empty area of its cell is clicked', () => {
    const fixture = TestBed.createComponent(CalendarComponent); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const dayButton = root.querySelector<HTMLButtonElement>('button[aria-label="15-09-2026"]');
    const cell = dayButton?.closest<HTMLElement>('[role="gridcell"]');
    expect(cell).not.toBeNull();
    cell?.click(); fixture.detectChanges();
    expect(root.querySelector<HTMLAnchorElement>('a[href*="/new?date=2026-09-15"]')).not.toBeNull();
  });

  it('does not force a horizontally scrollable calendar width', () => {
    const fixture = TestBed.createComponent(CalendarComponent); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.overflow-x-auto')).toBeNull();
  });
});
