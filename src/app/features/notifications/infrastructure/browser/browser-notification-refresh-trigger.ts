import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { EMPTY, Observable, fromEvent, map, share } from 'rxjs';
import { NotificationRefreshTrigger } from '../../application/ports/notification-inbox.gateway';

@Injectable()
export class BrowserNotificationRefreshTrigger implements NotificationRefreshTrigger {
  readonly focusChanges: Observable<void>;
  constructor(@Inject(DOCUMENT) document: Document) {
    const browserWindow = document.defaultView;
    this.focusChanges = browserWindow
      ? fromEvent(browserWindow, 'focus').pipe(map(() => undefined), share())
      : EMPTY;
  }
}
