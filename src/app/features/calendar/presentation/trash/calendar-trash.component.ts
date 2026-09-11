import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { HouseholdStore } from '../../../household';
import { ListCalendarTrashUseCase, PurgeCalendarEntryUseCase, RestoreCalendarEntryUseCase } from '../../application/use-cases/calendar.use-cases';
import { CalendarEntry } from '../../domain/calendar.models';

@Component({ selector: 'app-calendar-trash', standalone: true, imports: [RouterLink, TranslatePipe, ButtonComponent, CardComponent], templateUrl: './calendar-trash.component.html' })
export class CalendarTrashComponent {
  private readonly household = inject(HouseholdStore); private readonly list = inject(ListCalendarTrashUseCase); private readonly restoreUseCase = inject(RestoreCalendarEntryUseCase); private readonly purgeUseCase = inject(PurgeCalendarEntryUseCase); private readonly confirm = inject(ConfirmDialogService); private readonly notifications = inject(NotificationService); private readonly translate = inject(TranslateService);
  protected readonly entries = signal<readonly CalendarEntry[]>([]); protected readonly state = signal<'loading' | 'ready' | 'empty' | 'error'>('loading'); protected readonly pendingId = signal<string | null>(null);
  constructor() { effect(() => { const id = this.household.active()?.id; if (id) void this.load(id); }); }
  protected async restore(entry: CalendarEntry): Promise<void> { const id = this.household.active()?.id; if (!id || this.pendingId()) return; this.pendingId.set(entry.id); try { await firstValueFrom(this.restoreUseCase.execute(id, entry.id, entry.version)); this.entries.update(items => items.filter(item => item.id !== entry.id)); this.syncState(); } catch { this.error(); } finally { this.pendingId.set(null); } }
  protected async purge(entry: CalendarEntry): Promise<void> { const id = this.household.active()?.id; if (!id || this.pendingId()) return; if (!await this.confirm.open({ title: this.translate.instant('calendar.purgeTitle'), message: this.translate.instant('calendar.purgeMessage'), confirmLabel: this.translate.instant('calendar.purge'), cancelLabel: this.translate.instant('common.cancel'), variant: 'destructive' })) return; this.pendingId.set(entry.id); try { await firstValueFrom(this.purgeUseCase.execute(id, entry.id, entry.version)); this.entries.update(items => items.filter(item => item.id !== entry.id)); this.syncState(); } catch { this.error(); } finally { this.pendingId.set(null); } }
  private async load(id: string): Promise<void> { this.state.set('loading'); try { const items = await firstValueFrom(this.list.execute(id)); this.entries.set(items); this.syncState(); } catch { this.state.set('error'); } }
  private syncState(): void { this.state.set(this.entries().length ? 'ready' : 'empty'); }
  private error(): void { this.notifications.show({ id: 'calendar-trash-error', tone: 'error', message: this.translate.instant('calendar.actionError'), durationMs: 5000 }); }
}
