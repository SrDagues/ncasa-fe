export type HouseholdErrorKind = 'validation' | 'unauthenticated' | 'forbidden' | 'not-found' |
  'conflict' | 'expired' | 'network' | 'unexpected';

export class HouseholdApplicationError extends Error {
  constructor(readonly kind: HouseholdErrorKind, message: string, readonly fields: Readonly<Record<string, string>> = {}) {
    super(message);
  }
}
