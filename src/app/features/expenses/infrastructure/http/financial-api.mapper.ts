import { ExpenseApplicationError } from '../../application/expense.errors';
import { DebtSummary, MonthlyFinancialSummary, SettlementPage } from '../../application/expense.models';
import { Money, Settlement } from '../../domain';
type Json = Readonly<Record<string, unknown>>;
const invalid = (): never => { throw new ExpenseApplicationError('unexpected', 'Invalid financial response'); };
const object = (value: unknown): Json => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Json : invalid();
const text = (value: unknown): string => typeof value === 'string' ? value : invalid();
const nullable = (value: unknown): string | null => value === null ? null : text(value);
const numeric = (value: unknown): number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : invalid();
const array = (value: unknown): readonly unknown[] => Array.isArray(value) ? value : invalid();
const money = (value: unknown, currency: string): Money => { try { const decimal = text(value); const normalized = decimal.includes('.') ? decimal.replace(/0+$/, '').replace(/\.$/, '') : decimal; return Money.fromDecimal(normalized, currency); } catch { return invalid(); } };

export function mapMonthlySummary(value: unknown): MonthlyFinancialSummary {
  const dto = object(value); return { householdId: text(dto['householdId']), month: text(dto['month']), currencies: array(dto['currencies']).map(item => {
    const currencyDto = object(item); const currency = text(currencyDto['currency']); return { currency,
      totalExpenses: money(currencyDto['totalExpenses'], currency), members: array(currencyDto['members']).map(member => { const m = object(member); return { memberId: text(m['memberId']), paid: money(m['paid'], currency), allocated: money(m['allocated'], currency), net: money(m['net'], currency) }; }) };
  }) };
}
export function mapDebtSummary(value: unknown): DebtSummary {
  const dto = object(value); return { householdId: text(dto['householdId']), asOf: text(dto['asOf']), currencies: array(dto['currencies']).map(item => {
    const currencyDto = object(item); const currency = text(currencyDto['currency']); return { currency,
      members: array(currencyDto['members']).map(member => { const m = object(member); return { memberId: text(m['memberId']), paid: money(m['paid'], currency), allocated: money(m['allocated'], currency), settledOut: money(m['settledOut'], currency), settledIn: money(m['settledIn'], currency), net: money(m['net'], currency) }; }),
      suggestedSettlements: array(currencyDto['suggestedSettlements']).map(suggestion => { const s = object(suggestion); return { fromMemberId: text(s['fromMemberId']), toMemberId: text(s['toMemberId']), amount: money(s['amount'], currency) }; }) };
  }) };
}
export function mapSettlement(value: unknown): Settlement {
  const dto = object(value); const currency = text(dto['currency']); const status = text(dto['status']); if (status !== 'CONFIRMED' && status !== 'VOIDED') return invalid();
  return { id: text(dto['id']), householdId: text(dto['householdId']), createdByMemberId: text(dto['createdByMemberId']), fromMemberId: text(dto['fromMemberId']), toMemberId: text(dto['toMemberId']), amount: money(dto['amount'], currency), settlementDate: text(dto['settlementDate']), note: nullable(dto['note']), status, voidReason: nullable(dto['voidReason']), createdAt: text(dto['createdAt']), updatedAt: text(dto['updatedAt']), voidedAt: nullable(dto['voidedAt']), version: numeric(dto['version']) };
}
export function mapSettlementPage(value: unknown): SettlementPage { const dto = object(value); return { items: array(dto['items']).map(mapSettlement), page: numeric(dto['page']), size: numeric(dto['size']), totalElements: numeric(dto['totalElements']), totalPages: numeric(dto['totalPages']) }; }
