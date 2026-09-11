export type CalendarErrorKind = 'validation' | 'unauthenticated' | 'forbidden' | 'not-found' | 'conflict' | 'network' | 'unexpected';

export class CalendarApplicationError extends Error {
  constructor(readonly kind: CalendarErrorKind, message: string, readonly fields: Readonly<Record<string, string>> = {}) {
    super(message);
  }
}
