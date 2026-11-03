import { Money } from "../money/money.vo";
import {
  InsufficientFundsError,
  WalletCurrencyMismatchError,
} from "./wallet.errors";

export interface OpenWalletProps {
  id: string;
  playerId: string;
  initialBalance: Money;
  now?: Date;
}

export interface WalletState {
  id: string;
  playerId: string;
  currency: string;
  balance: Money;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Wallet {
  private constructor(
    public readonly id: string,
    public readonly playerId: string,
    public readonly currency: string,
    private _balance: Money,
    private _version: number,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  static open(props: OpenWalletProps): Wallet {
    const now = props.now ?? new Date();
    return new Wallet(
      props.id,
      props.playerId,
      props.initialBalance.currency,
      props.initialBalance,
      1,
      now,
      now
    );
  }

  static rehydrate(state: WalletState): Wallet {
    return new Wallet(
      state.id,
      state.playerId,
      state.currency,
      state.balance,
      state.version,
      state.createdAt,
      state.updatedAt
    );
  }

  get balance(): Money {
    return this._balance;
  }

  get version(): number {
    return this._version;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  mutateDebit(money: Money, now: Date): void {
    this.assertSameCurrency(money);
    if (this._balance.isLessThan(money)) {
      throw new InsufficientFundsError(this.id);
    }
    this._balance = this._balance.subtract(money);
    this._version += 1;
    this._updatedAt = now;
  }

  mutateCredit(money: Money, now: Date): void {
    this.assertSameCurrency(money);
    this._balance = this._balance.add(money);
    this._version += 1;
    this._updatedAt = now;
  }

  private assertSameCurrency(money: Money): void {
    if (this.currency !== money.currency) {
      throw new WalletCurrencyMismatchError(this.currency, money.currency);
    }
  }
}
