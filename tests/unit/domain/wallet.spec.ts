import { describe, expect, it } from "bun:test";
import { Money } from "@domain/money/money.vo";
import { Wallet } from "@domain/wallet/wallet.entity";
import { applyDebit } from "@domain/wallet/operations/apply-debit";
import { applyCredit } from "@domain/wallet/operations/apply-credit";
import {
  InsufficientFundsError,
  WalletCurrencyMismatchError,
} from "@domain/wallet/wallet.errors";

describe("Wallet & Standard Operations (Debit / Credit)", () => {
  const initialBalance = Money.from({ amount: "100.00", currency: "BRL" });

  it("should open a wallet with initial balance and version 1", () => {
    const wallet = Wallet.open({
      id: "w-1",
      playerId: "p-1",
      initialBalance,
    });

    expect(wallet.id).toBe("w-1");
    expect(wallet.playerId).toBe("p-1");
    expect(wallet.currency).toBe("BRL");
    expect(wallet.balance.amount).toBe("100.00");
    expect(wallet.version).toBe(1);
  });

  it("should apply debit correctly, update balance, version and produce ledger", () => {
    const wallet = Wallet.open({
      id: "w-1",
      playerId: "p-1",
      initialBalance,
    });
    const debitAmount = Money.from({ amount: "40.00", currency: "BRL" });

    const result = applyDebit({
      wallet,
      money: debitAmount,
      transactionId: "tx-debit-1",
      entryId: "entry-1",
      now: new Date(),
    });

    expect(result.wallet.balance.amount).toBe("60.00");
    expect(result.wallet.version).toBe(2);
    expect(result.ledgerEntry.balanceBefore.amount).toBe("100.00");
    expect(result.ledgerEntry.balanceAfter.amount).toBe("60.00");
    expect(result.ledgerEntry.money.amount).toBe("40.00");
  });

  it("should throw InsufficientFundsError when debit exceeds balance", () => {
    const wallet = Wallet.open({
      id: "w-1",
      playerId: "p-1",
      initialBalance,
    });
    const excessDebit = Money.from({ amount: "150.00", currency: "BRL" });

    expect(() =>
      applyDebit({
        wallet,
        money: excessDebit,
        transactionId: "tx-fail",
        entryId: "entry-2",
        now: new Date(),
      })
    ).toThrow(InsufficientFundsError);
  });

  it("should apply credit correctly, update balance, version and produce ledger", () => {
    const wallet = Wallet.open({
      id: "w-1",
      playerId: "p-1",
      initialBalance,
    });
    const creditAmount = Money.from({ amount: "50.00", currency: "BRL" });

    const result = applyCredit({
      wallet,
      money: creditAmount,
      transactionId: "tx-credit-1",
      entryId: "entry-3",
      now: new Date(),
    });

    expect(result.wallet.balance.amount).toBe("150.00");
    expect(result.wallet.version).toBe(2);
    expect(result.ledgerEntry.balanceBefore.amount).toBe("100.00");
    expect(result.ledgerEntry.balanceAfter.amount).toBe("150.00");
    expect(result.ledgerEntry.money.amount).toBe("50.00");
  });

  it("should throw WalletCurrencyMismatchError when operation currency differs", () => {
    const wallet = Wallet.open({
      id: "w-1",
      playerId: "p-1",
      initialBalance,
    });
    const usdMoney = Money.from({ amount: "10.00", currency: "USD" });

    expect(() =>
      applyDebit({
        wallet,
        money: usdMoney,
        transactionId: "tx-err",
        entryId: "entry-4",
        now: new Date(),
      })
    ).toThrow(WalletCurrencyMismatchError);
  });
});
