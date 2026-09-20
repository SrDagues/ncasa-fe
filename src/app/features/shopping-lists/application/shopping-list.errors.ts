export type ShoppingListErrorKind = 'validation' | 'unauthenticated' | 'forbidden' | 'not-found' | 'conflict' | 'network' | 'unexpected';

export class ShoppingListApplicationError extends Error {
  constructor(readonly kind: ShoppingListErrorKind, message: string, readonly fields: Readonly<Record<string, string>> = {}) {
    super(message);
  }
}
