import { Money } from "../money/money.vo";
import { InvalidLedgerArithmeticError } from "./wallet.errors";

export enum LedgerDirection {
  Debit = "DEBIT",
  Credit = "CREDIT",
}

export interface CreateLedgerEntryProps {
  id: string;
  walletId: string;
  transactionId: string;
  direction: LedgerDirection;
  money: Money;
  balanceBefore: Money;
  balanceAfter: Money;
  createdAt: Date;
}

export interface LedgerEntryState {
  id: string;
  walletId: string;
  transactionId: string;
  direction: LedgerDirection;
  money: Money;
  balanceBefore: Money;
  balanceAfter: Money;
  createdAt: Date;
}

export class WalletLedgerEntry {
  private constructor(
    public readonly id: string,
    public readonly walletId: string,
    public readonly transactionId: string,
    public readonly direction: LedgerDirection,
    public readonly money: Money,
    public readonly balanceBefore: Money,
    public readonly balanceAfter: Money,
    public readonly createdAt: Date
  ) {}

  get currency(): string {
    return this.money.currency;
  }

  static create(props: CreateLedgerEntryProps): WalletLedgerEntry {
    const entry = new WalletLedgerEntry(
      props.id,
      props.walletId,
      props.transactionId,
      props.direction,
      props.money,
      props.balanceBefore,
      props.balanceAfter,
      props.createdAt
    );

    if (!entry.isBalanced()) {
      throw new InvalidLedgerArithmeticError(
        `Unbalanced ledger: before=${props.balanceBefore.amount}, ` +
        `move=${props.money.amount}, after=${props.balanceAfter.amount}, ` +
        `direction=${props.direction}`
      );
    }

    return entry;
  }

  static rehydrate(state: LedgerEntryState): WalletLedgerEntry {
    return new WalletLedgerEntry(
      state.id,
      state.walletId,
      state.transactionId,
      state.direction,
      state.money,
      state.balanceBefore,
      state.balanceAfter,
      state.createdAt
    );
  }

  isBalanced(): boolean {
    if (this.direction === LedgerDirection.Debit) {
      const expected = this.balanceBefore.subtract(this.money);
      return expected.equals(this.balanceAfter);
    }
    const expected = this.balanceBefore.add(this.money);
    return expected.equals(this.balanceAfter);
  }
}
