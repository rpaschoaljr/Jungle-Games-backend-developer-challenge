import { describe, expect, it } from "bun:test";
import { Money } from "@domain/money/money.vo";
import {
  WalletLedgerEntry,
  LedgerDirection,
} from "@domain/wallet/ledger-entry.entity";
import { InvalidLedgerArithmeticError } from "@domain/wallet/wallet.errors";

describe("WalletLedgerEntry Entity", () => {
  const initialMoney = Money.from({ amount: "100.00", currency: "BRL" });
  const moveMoney = Money.from({ amount: "30.00", currency: "BRL" });

  it("should create a valid DEBIT ledger entry when balanced", () => {
    const afterDebit = initialMoney.subtract(moveMoney);
    const entry = WalletLedgerEntry.create({
      id: "entry-1",
      walletId: "wallet-1",
      transactionId: "tx-1",
      direction: LedgerDirection.Debit,
      money: moveMoney,
      balanceBefore: initialMoney,
      balanceAfter: afterDebit,
      createdAt: new Date(),
    });

    expect(entry.id).toBe("entry-1");
    expect(entry.direction).toBe(LedgerDirection.Debit);
    expect(entry.isBalanced()).toBe(true);
  });

  it("should create a valid CREDIT ledger entry when balanced", () => {
    const afterCredit = initialMoney.add(moveMoney);
    const entry = WalletLedgerEntry.create({
      id: "entry-2",
      walletId: "wallet-1",
      transactionId: "tx-2",
      direction: LedgerDirection.Credit,
      money: moveMoney,
      balanceBefore: initialMoney,
      balanceAfter: afterCredit,
      createdAt: new Date(),
    });

    expect(entry.direction).toBe(LedgerDirection.Credit);
    expect(entry.isBalanced()).toBe(true);
  });

  it("should throw InvalidLedgerArithmeticError on unbalanced DEBIT", () => {
    expect(() =>
      WalletLedgerEntry.create({
        id: "entry-3",
        walletId: "wallet-1",
        transactionId: "tx-3",
        direction: LedgerDirection.Debit,
        money: moveMoney,
        balanceBefore: initialMoney,
        balanceAfter: Money.from({ amount: "80.00", currency: "BRL" }),
        createdAt: new Date(),
      })
    ).toThrow(InvalidLedgerArithmeticError);
  });

  it("should throw InvalidLedgerArithmeticError on unbalanced CREDIT", () => {
    expect(() =>
      WalletLedgerEntry.create({
        id: "entry-4",
        walletId: "wallet-1",
        transactionId: "tx-4",
        direction: LedgerDirection.Credit,
        money: moveMoney,
        balanceBefore: initialMoney,
        balanceAfter: Money.from({ amount: "150.00", currency: "BRL" }),
        createdAt: new Date(),
      })
    ).toThrow(InvalidLedgerArithmeticError);
  });
});
