import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { describe, expect, it, vi } from 'vitest';
import es from '../../../../public/i18n/es.json';
import { AuthStore } from '../auth';
import { ListCalendarOccurrencesUseCase } from '../calendar';
import {
  GetDashboardFinancialSnapshotUseCase,
  GetDashboardUpcomingExpenseUseCase,
  ListRecentExpensesUseCase,
} from '../expenses';
import { HouseholdStore } from '../household';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent onboarding', () => {
  it('guides a new user to create a household instead of showing permanent loading messages', () => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ fallbackLang: 'es', lang: 'es' }),
        {
          provide: HouseholdStore,
          useValue: {
            state: signal('empty'),
            active: signal(null),
            households: signal([]),
            members: signal([]),
          },
        },
        { provide: AuthStore, useValue: { currentUser: signal({ id: 1, email: 'new@example.com', roles: [] }) } },
        { provide: ListRecentExpensesUseCase, useValue: { execute: vi.fn() } },
        { provide: GetDashboardFinancialSnapshotUseCase, useValue: { execute: vi.fn() } },
        { provide: GetDashboardUpcomingExpenseUseCase, useValue: { execute: vi.fn() } },
        { provide: ListCalendarOccurrencesUseCase, useValue: { execute: vi.fn() } },
      ],
    });
    TestBed.inject(TranslateService).setTranslation('es', es);

    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const createLink = [...root.querySelectorAll<HTMLAnchorElement>('a')]
      .find(link => link.textContent?.includes('Crear mi hogar'));

    expect(root.textContent).toContain('Primero, crea tu hogar');
    expect(root.textContent).not.toContain('Cargando gastos');
    expect(root.textContent).not.toContain('Cargando previsión');
    expect(createLink?.getAttribute('href')).toBe('/app/household');
  });
});
