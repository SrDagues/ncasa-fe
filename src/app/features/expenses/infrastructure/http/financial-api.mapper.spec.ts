import { describe, expect, it } from 'vitest';
import { ExpenseApplicationError } from '../../application/expense.errors';
import { mapDebtSummary, mapMonthlySummary, mapSettlement } from './financial-api.mapper';
describe('financial API mapper', () => {
  it('maps decimal strings and keeps currencies isolated', () => { const result = mapDebtSummary({ householdId: 'h1', asOf: '2026-08-20', currencies: [{ currency: 'EUR', members: [{ memberId: 'm1', paid: '10.0000', allocated: '4.0000', settledOut: '0.0000', settledIn: '1.0000', net: '5.0000' }], suggestedSettlements: [] }, { currency: 'USD', members: [], suggestedSettlements: [] }] }); expect(result.currencies[0].members[0].net.minorUnits).toBe(500n); expect(result.currencies[1].currency).toBe('USD'); });
  it('maps totals larger than safe JavaScript numbers', () => { const result = mapMonthlySummary({ householdId: 'h', month: '2026-08', currencies: [{ currency: 'EUR', totalExpenses: '900719925474099.99', members: [] }] }); expect(result.currencies[0].totalExpenses.toDecimal()).toBe('900719925474099.99'); });
  it('rejects unknown settlement states', () => expect(() => mapSettlement({ currency: 'EUR', status: 'PENDING' })).toThrow(ExpenseApplicationError));
});
