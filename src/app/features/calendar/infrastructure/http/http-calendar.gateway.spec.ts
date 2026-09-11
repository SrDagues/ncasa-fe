import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CalendarDraft } from '../../domain/calendar.models';
import { HttpCalendarGateway } from './http-calendar.gateway';

describe('HttpCalendarGateway', () => {
  let http: HttpTestingController; let gateway: HttpCalendarGateway;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); http = TestBed.inject(HttpTestingController); gateway = new HttpCalendarGateway(TestBed.inject(HttpClient), '/api'); });
  afterEach(() => http.verify());
  it('requests the authoritative occurrence range', () => { gateway.list('h1', '2026-08-31', '2026-10-04').subscribe(); const request = http.expectOne(value => value.url === '/api/households/h1/calendar-items'); expect(request.request.params.get('from')).toBe('2026-08-31'); expect(request.request.params.get('to')).toBe('2026-10-04'); request.flush([]); });
  it('creates an entry with the exact draft contract', () => { gateway.create('h1', draft).subscribe(result => expect(result.id).toBe('i1')); const request = http.expectOne('/api/households/h1/calendar-items'); expect(request.request.method).toBe('POST'); expect(request.request.body).toEqual(draft); request.flush(entryResponse); });
  it('preserves server validation fields so the form can highlight them', () => { let failure: unknown; gateway.create('h1', draft).subscribe({ error: error => failure = error }); const request = http.expectOne('/api/households/h1/calendar-items'); request.flush({ message: 'Invalid entry', fields: { title: 'must not be blank' } }, { status: 400, statusText: 'Bad Request' }); expect(failure).toBeInstanceOf(Error); expect(failure).toMatchObject({ kind: 'validation', fields: { title: 'must not be blank' } }); });
  it('updates this occurrence and following with optimistic versioning', () => { gateway.update('h1', 'i1', 4, draft, '2026-09-10').subscribe(); const request = http.expectOne(value => value.url === '/api/households/h1/calendar-items/i1'); expect(request.request.method).toBe('PUT'); expect(request.request.params.get('effectiveFrom')).toBe('2026-09-10'); expect(request.request.body).toEqual({ version: 4, entry: draft }); request.flush(entryResponse); });
  it('soft-deletes a recurring suffix rather than purging it', () => { gateway.moveToTrash('h1', 'i1', 4, '2026-09-10').subscribe(); const request = http.expectOne('/api/households/h1/calendar-items/i1/trash'); expect(request.request.method).toBe('POST'); expect(request.request.body).toEqual({ version: 4, effectiveFrom: '2026-09-10' }); request.flush(entryResponse); });
});
const timing = { allDay: true, startDate: '2026-09-10', startTime: null, endDate: null, endTime: null };
const draft: CalendarDraft = { kind: 'TASK', title: 'Comprar', timing, color: '#112233', location: null, note: null, link: null, participantMemberIds: ['m1'], recurrence: { frequency: 'WEEKLY', endType: 'NEVER', untilDate: null, totalOccurrences: null }, reminders: [{ daysBefore: 1, enabled: true }], reminderRecipientMemberIds: ['m1'], specialDateType: null, relatedMemberId: null };
const entryResponse = { id: 'i1', seriesId: 's1', householdId: 'h1', ...draft, createdByMemberId: 'm1', deletedAt: null, version: 5 };
