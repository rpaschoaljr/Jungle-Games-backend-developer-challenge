import { describe, expect, it } from "bun:test";
import { Money } from "@domain/money/money.vo";
import {
  WagerTransaction,
  WagerTransactionKind,
  WagerTransactionStatus,
} from "@domain/payment-state/wager-transaction.entity";
import {
  InvalidTransactionStateError,
  MissingReferenceTransactionError,
} from "@domain/payment-state/payment-state.errors";

describe("WagerTransaction State Machine", () => {
  const baseMoney = Money.from({ amount: "25.00", currency: "BRL" });

  it("should create transaction in PENDING status", () => {
    const tx = WagerTransaction.create({
      id: "tx-1",
      providerId: "prov-1",
      externalTransactionId: "ext-1",
      idempotencyKey: "prov-1:ext-1",
      payloadHash: "hash-abc",
      walletId: "w-1",
      playerId: "p-1",
      roundId: "r-1",
      gameId: "g-1",
      kind: WagerTransactionKind.Bet,
      money: baseMoney,
      createdAt: new Date(),
    });

    expect(tx.status).toBe(WagerTransactionStatus.Pending);
    expect(tx.isTerminal()).toBe(false);
    expect(tx.affectsBalance()).toBe(true);
  });

  it("should require reference for REFUND and ROLLBACK", () => {
    expect(() =>
      WagerTransaction.create({
        id: "tx-2",
        providerId: "prov-1",
        externalTransactionId: "ext-2",
        idempotencyKey: "prov-1:ext-2",
        payloadHash: "hash-abc",
        walletId: "w-1",
        playerId: "p-1",
        roundId: "r-1",
        gameId: "g-1",
        kind: WagerTransactionKind.Refund,
        money: baseMoney,
        createdAt: new Date(),
      })
    ).toThrow(MissingReferenceTransactionError);
  });

  it("should transition from PENDING to PROCESSED and become terminal", () => {
    const tx = WagerTransaction.create({
      id: "tx-3",
      providerId: "prov-1",
      externalTransactionId: "ext-3",
      idempotencyKey: "prov-1:ext-3",
      payloadHash: "hash-abc",
      walletId: "w-1",
      playerId: "p-1",
      roundId: "r-1",
      gameId: "g-1",
      kind: WagerTransactionKind.Bet,
      money: baseMoney,
      createdAt: new Date(),
    });

    tx.markProcessed("ref-0", new Date());
    expect(tx.status).toBe(WagerTransactionStatus.Processed);
    expect(tx.isTerminal()).toBe(true);

    expect(() => tx.reject("ANY_CODE")).toThrow(InvalidTransactionStateError);
  });

  it("should transition to REJECTED and become terminal", () => {
    const tx = WagerTransaction.create({
      id: "tx-4",
      providerId: "prov-1",
      externalTransactionId: "ext-4",
      idempotencyKey: "prov-1:ext-4",
      payloadHash: "hash-abc",
      walletId: "w-1",
      playerId: "p-1",
      roundId: "r-1",
      gameId: "g-1",
      kind: WagerTransactionKind.Bet,
      money: baseMoney,
      createdAt: new Date(),
    });

    tx.reject("INSUFFICIENT_FUNDS");
    expect(tx.status).toBe(WagerTransactionStatus.Rejected);
    expect(tx.failureCode).toBe("INSUFFICIENT_FUNDS");
    expect(tx.isTerminal()).toBe(true);
  });

  it("should identify that LOSS does not affect balance", () => {
    const tx = WagerTransaction.create({
      id: "tx-5",
      providerId: "prov-1",
      externalTransactionId: "ext-5",
      idempotencyKey: "prov-1:ext-5",
      payloadHash: "hash-abc",
      walletId: "w-1",
      playerId: "p-1",
      roundId: "r-1",
      gameId: "g-1",
      kind: WagerTransactionKind.Loss,
      money: baseMoney,
      createdAt: new Date(),
    });

    expect(tx.affectsBalance()).toBe(false);
  });
});
