import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { ExpenseDraftSnapshot } from '../../application/expense.models';
import { ExpenseDraftGateway } from '../../application/ports/expense-draft.gateway';
import { ExpenseDraftId, ExpenseDraftStatus, HouseholdRef } from '../../domain';
import { mapExpense } from './expense-api.mapper';
import { normalizeExpenseHttpErrors } from './expense-http-errors';
import { mapExpenseDraft, mapExpenseDrafts } from './expense-stage2-api.mapper';

export class HttpExpenseDraftGateway implements ExpenseDraftGateway {
  constructor(private readonly http: HttpClient, private readonly apiUrl: string) {}
  create(householdId: HouseholdRef) { return this.http.post<unknown>(this.collection(householdId), {}).pipe(map(mapExpenseDraft), normalizeExpenseHttpErrors()); }
  list(householdId: HouseholdRef, status: ExpenseDraftStatus) { return this.http.get<unknown>(this.collection(householdId), { params: new HttpParams().set('status', status) }).pipe(map(mapExpenseDrafts), normalizeExpenseHttpErrors()); }
  get(householdId: HouseholdRef, id: ExpenseDraftId) { return this.http.get<unknown>(`${this.collection(householdId)}/${id}`).pipe(map(mapExpenseDraft), normalizeExpenseHttpErrors()); }
  update(householdId: HouseholdRef, id: ExpenseDraftId, snapshot: ExpenseDraftSnapshot, version: number) {
    return this.http.put<unknown>(`${this.collection(householdId)}/${id}`, { ...serializeSnapshot(snapshot), version }).pipe(map(mapExpenseDraft), normalizeExpenseHttpErrors());
  }
  confirm(householdId: HouseholdRef, id: ExpenseDraftId, version: number) { return this.http.post<unknown>(`${this.collection(householdId)}/${id}/confirm`, { version }).pipe(map(mapExpense), normalizeExpenseHttpErrors()); }
  discard(householdId: HouseholdRef, id: ExpenseDraftId, version: number) { return this.http.post<unknown>(`${this.collection(householdId)}/${id}/discard`, { version }).pipe(map(mapExpenseDraft), normalizeExpenseHttpErrors()); }
  private collection(householdId: HouseholdRef) { return `${this.apiUrl}/households/${householdId}/expense-drafts`; }
}

const serializeSnapshot = (snapshot: ExpenseDraftSnapshot): Readonly<Record<string, unknown>> => ({
  description: snapshot.description, amount: snapshot.amount?.toDecimal() ?? null, currency: snapshot.currency,
  expenseDate: snapshot.expenseDate, payerMemberId: snapshot.payerMemberId, categoryId: snapshot.categoryId,
  split: snapshot.split === null ? null : snapshot.split.type === 'EQUAL' ? { type: 'EQUAL', memberIds: snapshot.split.memberIds }
    : snapshot.split.type === 'EXACT' ? { type: 'EXACT', allocations: snapshot.split.allocations.map(item => ({ memberId: item.memberId, amount: item.amount.toDecimal() })) }
    : { type: 'PERCENTAGE', allocations: snapshot.split.allocations.map(item => ({ memberId: item.memberId, percentage: item.percentage.toDecimal() })) },
});
