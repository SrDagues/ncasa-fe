import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, beforeEach, afterEach, expect, it } from 'vitest';
import { HttpHouseholdGateway } from './http-household.gateway';
import { HouseholdApplicationError } from '../../application/household.errors';

describe('HttpHouseholdGateway', () => {
  let http: HttpTestingController;
  let gateway: HttpHouseholdGateway;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    gateway = new HttpHouseholdGateway(TestBed.inject(HttpClient), '/api');
  });

  afterEach(() => http.verify());

  it('lists and maps the authenticated account households', async () => {
    const result = firstValueFrom(gateway.list());
    http.expectOne('/api/households').flush([{ id: 'h1', name: 'Casa', status: 'ACTIVE',
      currentMemberId: 'm1', currentRole: 'ADMIN', owner: true }]);
    await expect(result).resolves.toEqual([{ id: 'h1', name: 'Casa', status: 'ACTIVE',
      currentMemberId: 'm1', currentRole: 'ADMIN', owner: true }]);
  });

  it('sends a normalized invitation command', async () => {
    const result = firstValueFrom(gateway.invite('h1', 'person@example.com', 'MEMBER'));
    const request = http.expectOne('/api/households/h1/invitations');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'person@example.com', role: 'MEMBER' });
    request.flush({ id: 'i1', householdId: 'h1', email: 'person@example.com', role: 'MEMBER',
      status: 'PENDING', expiresAt: '2026-08-27T10:00:00Z', deliverySucceeded: true });
    await expect(result).resolves.toMatchObject({ id: 'i1', deliverySucceeded: true });
  });

  it('translates a conflict response into an application error', async () => {
    const result = firstValueFrom(gateway.rename('h1', 'Casa nueva'));
    http.expectOne('/api/households/h1').flush({ message: 'Concurrent change', fields: {} },
      { status: 409, statusText: 'Conflict' });
    await expect(result).rejects.toEqual(expect.objectContaining<Partial<HouseholdApplicationError>>({ kind: 'conflict' }));
  });
});
