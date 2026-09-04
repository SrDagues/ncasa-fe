import { describe, expect, it } from 'vitest';
import { Money } from './money';
import { distributePercentagesEqually, materializePercentageSplit } from './expense.models';
import { Percentage } from './percentage';

describe('Percentage', () => {
  it('parses and serializes at most two decimals without floating point', () => {
    expect(Percentage.fromDecimal('33.3').basisPoints).toBe(3330n);
    expect(Percentage.fromDecimal('33.3').toDecimal()).toBe('33.30');
  });

  it.each(['0', '-1', '100.01', '10.001', 'abc'])('rejects invalid value %s', value => {
    expect(() => Percentage.fromDecimal(value)).toThrow();
  });
});

describe('percentage expense split', () => {
  it('distributes one hundred percent deterministically', () => {
    expect(distributePercentagesEqually(['c', 'a', 'b']).map(item => [item.memberId, item.percentage.toDecimal()]))
      .toEqual([['a', '33.34'], ['b', '33.33'], ['c', '33.33']]);
  });

  it('materializes remainder cents by remainder and member id', () => {
    const result = materializePercentageSplit(Money.fromDecimal('0.05', 'EUR'), [
      { memberId: 'b', percentage: Percentage.fromDecimal('50') },
      { memberId: 'a', percentage: Percentage.fromDecimal('50') },
    ]);
    expect(result.map(item => [item.memberId, item.amount.toDecimal()])).toEqual([['a', '0.03'], ['b', '0.02']]);
    expect(result.reduce((sum, item) => sum.add(item.amount), Money.fromMinorUnits(0n, 'EUR')).toDecimal()).toBe('0.05');
  });

  it('requires unique members and exactly one hundred percent', () => {
    const total = Money.fromDecimal('10', 'EUR');
    expect(() => materializePercentageSplit(total, [{ memberId: 'a', percentage: Percentage.fromDecimal('90') }])).toThrow();
    expect(() => materializePercentageSplit(total, [
      { memberId: 'a', percentage: Percentage.fromDecimal('50') },
      { memberId: 'a', percentage: Percentage.fromDecimal('50') },
    ])).toThrow();
  });
});
