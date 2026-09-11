import { CalendarDraft } from '../../domain/calendar.models';
import { CalendarGateway } from '../ports/calendar.gateway';

export class ListCalendarOccurrencesUseCase { constructor(private readonly gateway: CalendarGateway) {} execute(householdId: string, from: string, to: string) { return this.gateway.list(householdId, from, to); } }
export class GetCalendarEntryUseCase { constructor(private readonly gateway: CalendarGateway) {} execute(householdId: string, itemId: string) { return this.gateway.get(householdId, itemId); } }
export class CreateCalendarEntryUseCase { constructor(private readonly gateway: CalendarGateway) {} execute(householdId: string, draft: CalendarDraft) { return this.gateway.create(householdId, draft); } }
export class UpdateCalendarEntryUseCase { constructor(private readonly gateway: CalendarGateway) {} execute(householdId: string, itemId: string, version: number, draft: CalendarDraft, effectiveFrom?: string) { return this.gateway.update(householdId, itemId, version, draft, effectiveFrom); } }
export class ListCalendarTrashUseCase { constructor(private readonly gateway: CalendarGateway) {} execute(householdId: string) { return this.gateway.trash(householdId); } }
export class TrashCalendarEntryUseCase { constructor(private readonly gateway: CalendarGateway) {} execute(householdId: string, itemId: string, version: number, effectiveFrom?: string) { return this.gateway.moveToTrash(householdId, itemId, version, effectiveFrom); } }
export class RestoreCalendarEntryUseCase { constructor(private readonly gateway: CalendarGateway) {} execute(householdId: string, itemId: string, version: number) { return this.gateway.restore(householdId, itemId, version); } }
export class PurgeCalendarEntryUseCase { constructor(private readonly gateway: CalendarGateway) {} execute(householdId: string, itemId: string, version: number) { return this.gateway.purge(householdId, itemId, version); } }
export class CompleteCalendarOccurrenceUseCase { constructor(private readonly gateway: CalendarGateway) {} execute(householdId: string, itemId: string, occurrenceKey: string, version: number, completed: boolean) { return this.gateway.setOccurrenceCompleted(householdId, itemId, occurrenceKey, version, completed); } }
