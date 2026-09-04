export class PercentageError extends Error {}

export class Percentage {
  static readonly totalBasisPoints = 10_000n;

  private constructor(readonly basisPoints: bigint) {}

  static fromDecimal(value: string): Percentage {
    const match = value.trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
    if (!match) throw new PercentageError('Invalid percentage');
    const basisPoints = BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0') || '0');
    if (basisPoints <= 0n || basisPoints > Percentage.totalBasisPoints) {
      throw new PercentageError('Percentage must be greater than zero and at most 100.00');
    }
    return new Percentage(basisPoints);
  }

  static fromBasisPoints(basisPoints: bigint): Percentage {
    if (basisPoints <= 0n || basisPoints > Percentage.totalBasisPoints) {
      throw new PercentageError('Percentage must be greater than zero and at most 100.00');
    }
    return new Percentage(basisPoints);
  }

  toDecimal(): string {
    const whole = this.basisPoints / 100n;
    const decimals = (this.basisPoints % 100n).toString().padStart(2, '0');
    return `${whole}.${decimals}`;
  }
}
