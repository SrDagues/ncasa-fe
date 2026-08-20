export class MoneyError extends Error {}

export class Money {
  private constructor(
    readonly minorUnits: bigint,
    readonly currency: string,
    readonly fractionDigits: number,
  ) {}

  static fromDecimal(value: string, currency: string): Money {
    const normalizedCurrency = currency.trim().toUpperCase();
    const fractionDigits = currencyDigits(normalizedCurrency);
    const match = value.trim().match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
    if (!match) throw new MoneyError('Invalid monetary amount');
    const decimals = match[3] ?? '';
    if (decimals.length > fractionDigits) throw new MoneyError(`Too many fraction digits for ${normalizedCurrency}`);
    if (match[2].replace(/^0+/, '').length > 15) throw new MoneyError('Amount exceeds supported precision');
    const units = BigInt(match[2]) * 10n ** BigInt(fractionDigits)
      + BigInt(decimals.padEnd(fractionDigits, '0') || '0');
    return new Money(match[1] === '-' ? -units : units, normalizedCurrency, fractionDigits);
  }

  static fromMinorUnits(minorUnits: bigint, currency: string): Money {
    const normalizedCurrency = currency.trim().toUpperCase();
    return new Money(minorUnits, normalizedCurrency, currencyDigits(normalizedCurrency));
  }

  isPositive(): boolean { return this.minorUnits > 0n; }

  add(other: Money): Money {
    this.requireSameCurrency(other);
    return Money.fromMinorUnits(this.minorUnits + other.minorUnits, this.currency);
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.minorUnits === other.minorUnits;
  }

  toDecimal(): string {
    const negative = this.minorUnits < 0n;
    const absolute = negative ? -this.minorUnits : this.minorUnits;
    const divisor = 10n ** BigInt(this.fractionDigits);
    const integer = absolute / divisor;
    if (this.fractionDigits === 0) return `${negative ? '-' : ''}${integer}`;
    const decimals = (absolute % divisor).toString().padStart(this.fractionDigits, '0');
    return `${negative ? '-' : ''}${integer}.${decimals}`;
  }

  private requireSameCurrency(other: Money): void {
    if (this.currency !== other.currency) throw new MoneyError('Money currencies must match');
  }
}

const currencyDigits = (currency: string): number => {
  if (!/^[A-Z]{3}$/.test(currency)) throw new MoneyError('Invalid currency');
  try {
    const digits = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits;
    if (digits === undefined) throw new MoneyError(`Unsupported currency: ${currency}`);
    if (digits < 0 || digits > 4) throw new MoneyError(`Unsupported currency: ${currency}`);
    return digits;
  } catch (error) {
    if (error instanceof MoneyError) throw error;
    throw new MoneyError(`Unknown currency: ${currency}`);
  }
};
