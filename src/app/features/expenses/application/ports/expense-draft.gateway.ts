import { Observable } from 'rxjs';
import { Expense, ExpenseDraft, ExpenseDraftId, ExpenseDraftStatus, HouseholdRef } from '../../domain';
import { ExpenseDraftSnapshot } from '../expense.models';

export interface ExpenseDraftGateway {
  create(householdId: HouseholdRef): Observable<ExpenseDraft>;
  list(householdId: HouseholdRef, status: ExpenseDraftStatus): Observable<readonly ExpenseDraft[]>;
  get(householdId: HouseholdRef, draftId: ExpenseDraftId): Observable<ExpenseDraft>;
  update(householdId: HouseholdRef, draftId: ExpenseDraftId, snapshot: ExpenseDraftSnapshot, version: number): Observable<ExpenseDraft>;
  confirm(householdId: HouseholdRef, draftId: ExpenseDraftId, version: number): Observable<Expense>;
  discard(householdId: HouseholdRef, draftId: ExpenseDraftId, version: number): Observable<ExpenseDraft>;
}
