import { CurrencyMismatchError, InvalidMoneyError } from "./money.errors";

export interface MoneyProps {
  amount: string;
  currency: string;
}

export class Money {
  private static readonly DECIMAL_REGEX = /^\d+\.\d{2}$/;

  private constructor(
    private readonly cents: bigint,
    public readonly currency: string
  ) {}

  static from(props: MoneyProps): Money {
    if (typeof props.amount !== "string") {
      throw new InvalidMoneyError("Amount must be a string");
    }
    const trimmed = props.amount.trim();
    if (!Money.DECIMAL_REGEX.test(trimmed)) {
      throw new InvalidMoneyError(
        `Invalid amount format: "${props.amount}". Expected "XX.YY"`
      );
    }
    const [whole, fraction] = trimmed.split(".");
    const cents = BigInt(whole) * 100n + BigInt(fraction);
    return new Money(cents, props.currency.toUpperCase());
  }

  static zero(currency: string): Money {
    return new Money(0n, currency.toUpperCase());
  }

  static fromCents(cents: bigint, currency: string): Money {
    return new Money(cents, currency.toUpperCase());
  }

  get amount(): string {
    const isNegative = this.cents < 0n;
    const abs = isNegative ? -this.cents : this.cents;
    const whole = abs / 100n;
    const frac = abs % 100n;
    const fracStr = frac < 10n ? `0${frac}` : frac.toString();
    const sign = isNegative ? "-" : "";
    return `${sign}${whole}.${fracStr}`;
  }

  toCents(): bigint {
    return this.cents;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents + other.cents, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents - other.cents, this.currency);
  }

  negate(): Money {
    return new Money(-this.cents, this.currency);
  }

  isZero(): boolean {
    return this.cents === 0n;
  }

  isPositive(): boolean {
    return this.cents > 0n;
  }

  isNegative(): boolean {
    return this.cents < 0n;
  }

  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents < other.cents;
  }

  equals(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents === other.cents;
  }

  toJSON(): MoneyProps {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }

  toString(): string {
    return `${this.amount} ${this.currency}`;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
  }
}
