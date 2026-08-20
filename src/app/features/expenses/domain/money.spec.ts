import { describe, expect, it } from 'vitest';
import { Money, MoneyError } from './money';
import { ExpenseSplitError, splitEqually, validateExactSplit } from './expense.models';

describe('Money and expense splits', () => {
  it('parses and serializes EUR without floating point arithmetic', () => {
    const money = Money.fromDecimal('900719925474099.99', 'eur');
    expect(money.minorUnits).toBe(90071992547409999n);
    expect(money.toDecimal()).toBe('900719925474099.99');
    expect(money.currency).toBe('EUR');
  });

  it('rejects excess fraction digits', () => {
    expect(() => Money.fromDecimal('1.001', 'EUR')).toThrow(MoneyError);
    expect(() => Money.fromDecimal('1000000000000000.00', 'EUR')).toThrow(MoneyError);
  });

  it('distributes remainder cents deterministically by member identifier', () => {
    const result = splitEqually(Money.fromDecimal('10.00', 'EUR'), ['m3', 'm1', 'm2']);
    expect(result.map(item => [item.memberId, item.amount.toDecimal()])).toEqual([
      ['m1', '3.34'], ['m2', '3.33'], ['m3', '3.33'],
    ]);
  });

  it('accepts exact allocations only when they are positive, unique and add up', () => {
    const total = Money.fromDecimal('10.00', 'EUR');
    expect(() => validateExactSplit(total, [
      { memberId: 'm1', amount: Money.fromDecimal('4.00', 'EUR') },
      { memberId: 'm2', amount: Money.fromDecimal('6.00', 'EUR') },
    ])).not.toThrow();
    expect(() => validateExactSplit(total, [
      { memberId: 'm1', amount: Money.fromDecimal('9.00', 'EUR') },
    ])).toThrow(ExpenseSplitError);
  });
});
