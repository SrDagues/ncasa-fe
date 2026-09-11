import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NotificationApplicationError } from '../../application/notification.errors';
import { HttpNotificationInboxGateway } from './http-notification-inbox.gateway';

const notificationResponse = {
  id: 'n1', kind: 'EXPENSE_PLAN_OCCURRENCE_APPROACHING', householdId: 'h1', planId: 'p1', subject: 'Rent',
  amount: '900.00', currency: 'EUR', occurrenceDate: '2026-09-10', occurrenceNumber: 2, totalOccurrences: 12,
  calendarEntryId: null, completedByMemberId: null, attentionReason: null,
  occurredAt: '2026-09-04T08:00:00Z', createdAt: '2026-09-04T08:00:01Z', readAt: null,
};

describe('HttpNotificationInboxGateway', () => {
  let http: HttpTestingController; let gateway: HttpNotificationInboxGateway;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController); gateway = new HttpNotificationInboxGateway(TestBed.inject(HttpClient), '/api');
  });
  afterEach(() => http.verify());

  it('lists notifications with filters and pagination', () => {
    gateway.list({ unreadOnly: true, page: 1, size: 5 }).subscribe(value => expect(value.items[0].id).toBe('n1'));
    const request = http.expectOne(r => r.url === '/api/notifications');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('unreadOnly')).toBe('true'); expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('5');
    request.flush({ items: [notificationResponse], page: 1, size: 5, totalElements: 6, totalPages: 2 });
  });

  it('loads the unread count', () => {
    gateway.countUnread().subscribe(value => expect(value).toBe(4));
    const request = http.expectOne('/api/notifications/unread-count'); expect(request.request.method).toBe('GET');
    request.flush({ unreadCount: 4 });
  });

  it('marks one notification read with an encoded id', () => {
    gateway.markRead('n/1').subscribe(value => expect(value.isUnread).toBe(false));
    const request = http.expectOne('/api/notifications/n%2F1/read');
    expect(request.request.method).toBe('POST'); expect(request.request.body).toBeNull();
    request.flush({ ...notificationResponse, id: 'n/1', readAt: '2026-09-04T09:00:00Z' });
  });

  it('marks every notification read without expecting a response body', () => {
    let completed = false; gateway.markAllRead().subscribe({ complete: () => completed = true });
    const request = http.expectOne('/api/notifications/read-all'); expect(request.request.method).toBe('POST');
    request.flush(null, { status: 204, statusText: 'No Content' }); expect(completed).toBe(true);
  });

  it.each([[0, 'network'], [400, 'validation'], [401, 'unauthenticated'], [403, 'forbidden'], [404, 'not-found'], [500, 'unexpected']] as const)
  ('normalizes HTTP status %s as %s', (status, kind) => {
    let failure: unknown; gateway.countUnread().subscribe({ error: error => failure = error });
    http.expectOne('/api/notifications/unread-count').flush(null, { status, statusText: 'Failure' });
    expect(failure).toBeInstanceOf(NotificationApplicationError); expect(failure).toMatchObject({ kind });
  });
});
