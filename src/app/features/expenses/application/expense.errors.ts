export type ExpenseErrorKind = 'validation' | 'unauthenticated' | 'forbidden' | 'not-found' | 'conflict' | 'network' | 'unexpected';

export class ExpenseApplicationError extends Error {
  constructor(
    readonly kind: ExpenseErrorKind,
    message: string,
    readonly fields: Readonly<Record<string, string>> = {},
  ) { super(message); }
}
