import { describe, expect, it } from "bun:test";
import { validateBetPayload } from "@application/operations/bet/bet.validator";
import { validateRefundPayload } from "@application/operations/refund/refund.validator";

describe("Operation Validators (Bet & Refund)", () => {
  const validBet = {
    providerId: "prov-a",
    externalTransactionId: "tx-1",
    playerId: "0192f28f-5dc0-7d58-bdb2-814ad6a0f4a1",
    walletId: "0192f291-27dd-7d3f-8071-5f8685deef37",
    roundId: "round-1",
    gameId: "game-1",
    kind: "BET",
    money: { amount: "25.00", currency: "BRL" },
  };

  it("should accept a valid bet payload", () => {
    const result = validateBetPayload(validBet);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("should reject bet with invalid UUID for walletId or playerId", () => {
    const invalid = { ...validBet, walletId: "invalid-uuid" };
    const result = validateBetPayload(invalid);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("walletId"))).toBe(true);
  });

  it("should reject bet with SQL injection in string fields", () => {
    const sqlInj = { ...validBet, providerId: "' OR '1'='1" };
    const result = validateBetPayload(sqlInj);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("providerId"))).toBe(true);
  });

  it("should reject refund when referenceExternalTransactionId is missing", () => {
    const refundPayload = { ...validBet, kind: "REFUND" };
    const result = validateRefundPayload(refundPayload);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) => e.includes("referenceExternalTransactionId"))
    ).toBe(true);
  });

  it("should accept valid refund when reference is provided", () => {
    const refundPayload = {
      ...validBet,
      kind: "REFUND",
      referenceExternalTransactionId: "tx-1",
    };
    const result = validateRefundPayload(refundPayload);
    expect(result.isValid).toBe(true);
  });
});
