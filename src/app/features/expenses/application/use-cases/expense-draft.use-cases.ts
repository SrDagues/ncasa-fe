import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { ExpenseApplicationError } from '../expense.errors';
import { SaveExpenseDraftCommand } from '../expense.models';
import { ExpenseDraftGateway } from '../ports/expense-draft.gateway';
import { ExpenseDraft, ExpenseDraftId, HouseholdRef } from '../../domain';

export class DraftSaveError extends ExpenseApplicationError {
  constructor(error: ExpenseApplicationError, readonly recoverableDraft: ExpenseDraft) {
    super(error.kind, error.message, error.fields);
  }
}
export class ListExpenseDraftsUseCase { constructor(private readonly gateway: ExpenseDraftGateway) {} execute(householdId: HouseholdRef) { return this.gateway.list(householdId, 'OPEN'); } }
export class GetExpenseDraftUseCase { constructor(private readonly gateway: ExpenseDraftGateway) {} execute(householdId: HouseholdRef, id: ExpenseDraftId) { return this.gateway.get(householdId, id); } }
export class DiscardExpenseDraftUseCase { constructor(private readonly gateway: ExpenseDraftGateway) {} execute(householdId: HouseholdRef, id: ExpenseDraftId, version: number) { return this.gateway.discard(householdId, id, version); } }

export class SaveExpenseDraftUseCase {
  constructor(private readonly gateway: ExpenseDraftGateway) {}
  execute(command: SaveExpenseDraftCommand): Observable<ExpenseDraft> {
    if (command.draftId) return this.gateway.update(command.householdId, command.draftId, command.snapshot, command.version ?? 0);
    return this.gateway.create(command.householdId).pipe(switchMap(created => this.gateway.update(
      command.householdId, created.id, command.snapshot, created.version,
    ).pipe(catchError(error => throwError(() => new DraftSaveError(asApplicationError(error), created))))));
  }
}

export class SaveAndConfirmExpenseDraftUseCase {
  constructor(private readonly save: SaveExpenseDraftUseCase, private readonly gateway: ExpenseDraftGateway) {}
  execute(command: SaveExpenseDraftCommand) {
    return this.save.execute(command).pipe(switchMap(draft => this.gateway.confirm(command.householdId, draft.id, draft.version)));
  }
}

const asApplicationError = (error: unknown): ExpenseApplicationError => error instanceof ExpenseApplicationError
  ? error : new ExpenseApplicationError('unexpected', error instanceof Error ? error.message : 'Unexpected error');
