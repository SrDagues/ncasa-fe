import { HttpClient } from '@angular/common/http';
import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CompleteCalendarOccurrenceUseCase, CreateCalendarEntryUseCase, GetCalendarEntryUseCase, ListCalendarOccurrencesUseCase, ListCalendarTrashUseCase, PurgeCalendarEntryUseCase, RestoreCalendarEntryUseCase, TrashCalendarEntryUseCase, UpdateCalendarEntryUseCase } from '../application/use-cases/calendar.use-cases';
import { HttpCalendarGateway } from './http/http-calendar.gateway';

export function provideCalendar(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: HttpCalendarGateway, useFactory: () => new HttpCalendarGateway(inject(HttpClient), environment.apiUrl) },
    { provide: ListCalendarOccurrencesUseCase, useFactory: () => new ListCalendarOccurrencesUseCase(inject(HttpCalendarGateway)) },
    { provide: GetCalendarEntryUseCase, useFactory: () => new GetCalendarEntryUseCase(inject(HttpCalendarGateway)) },
    { provide: CreateCalendarEntryUseCase, useFactory: () => new CreateCalendarEntryUseCase(inject(HttpCalendarGateway)) },
    { provide: UpdateCalendarEntryUseCase, useFactory: () => new UpdateCalendarEntryUseCase(inject(HttpCalendarGateway)) },
    { provide: ListCalendarTrashUseCase, useFactory: () => new ListCalendarTrashUseCase(inject(HttpCalendarGateway)) },
    { provide: TrashCalendarEntryUseCase, useFactory: () => new TrashCalendarEntryUseCase(inject(HttpCalendarGateway)) },
    { provide: RestoreCalendarEntryUseCase, useFactory: () => new RestoreCalendarEntryUseCase(inject(HttpCalendarGateway)) },
    { provide: PurgeCalendarEntryUseCase, useFactory: () => new PurgeCalendarEntryUseCase(inject(HttpCalendarGateway)) },
    { provide: CompleteCalendarOccurrenceUseCase, useFactory: () => new CompleteCalendarOccurrenceUseCase(inject(HttpCalendarGateway)) },
  ]);
}
