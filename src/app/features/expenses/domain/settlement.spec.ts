import { describe, expect, it } from 'vitest';
import { CurrentMemberPosition, Money, SettlementValidationError, validateSettlement } from './index';
const position = (memberId: string, net: string, currency = 'EUR'): CurrentMemberPosition => ({ memberId, paid: Money.fromDecimal('0', currency), allocated: Money.fromDecimal('0', currency), settledOut: Money.fromDecimal('0', currency), settledIn: Money.fromDecimal('0', currency), net: Money.fromDecimal(net, currency) });
describe('settlement validation', () => {
  it('accepts a transfer that reduces debt exactly', () => expect(() => validateSettlement(Money.fromDecimal('4.25', 'EUR'), position('debtor', '-4.25'), position('creditor', '4.25'))).not.toThrow());
  it('rejects wrong direction and overpayment', () => { expect(() => validateSettlement(Money.fromDecimal('1', 'EUR'), position('a', '2'), position('b', '-2'))).toThrow(SettlementValidationError); expect(() => validateSettlement(Money.fromDecimal('4.26', 'EUR'), position('a', '-4.25'), position('b', '4.25'))).toThrow(SettlementValidationError); });
  it('never mixes currencies', () => expect(() => validateSettlement(Money.fromDecimal('1', 'EUR'), position('a', '-1'), position('b', '1', 'USD'))).toThrow(SettlementValidationError));
});
