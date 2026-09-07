export type NotificationErrorKind = 'validation' | 'unauthenticated' | 'forbidden' | 'not-found' | 'network' | 'unexpected';

export class NotificationApplicationError extends Error {
  constructor(readonly kind: NotificationErrorKind, message: string) { super(message); }
}
