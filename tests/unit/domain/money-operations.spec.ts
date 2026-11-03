import { describe, expect, it } from "bun:test";
import { Money } from "@domain/money/money.vo";
import { CurrencyMismatchError } from "@domain/money/money.errors";

describe("Money Value Object - Operations", () => {
  it("should create Money.zero with 0.00", () => {
    const zero = Money.zero("BRL");
    expect(zero.amount).toBe("0.00");
    expect(zero.isZero()).toBe(true);
  });

  it("should correctly add two money values without float inaccuracies", () => {
    const m1 = Money.from({ amount: "0.10", currency: "BRL" });
    const m2 = Money.from({ amount: "0.20", currency: "BRL" });
    const result = m1.add(m2);
    expect(result.amount).toBe("0.30");
  });

  it("should correctly subtract money values", () => {
    const m1 = Money.from({ amount: "100.00", currency: "BRL" });
    const m2 = Money.from({ amount: "25.50", currency: "BRL" });
    const result = m1.subtract(m2);
    expect(result.amount).toBe("74.50");
  });

  it("should detect equality and comparison correctly", () => {
    const m1 = Money.from({ amount: "50.00", currency: "BRL" });
    const m2 = Money.from({ amount: "50.00", currency: "BRL" });
    const m3 = Money.from({ amount: "80.00", currency: "BRL" });

    expect(m1.equals(m2)).toBe(true);
    expect(m1.isLessThan(m3)).toBe(true);
    expect(m3.isLessThan(m1)).toBe(false);
  });

  it("should throw CurrencyMismatchError when operating different currencies", () => {
    const brl = Money.from({ amount: "50.00", currency: "BRL" });
    const usd = Money.from({ amount: "50.00", currency: "USD" });

    expect(() => brl.add(usd)).toThrow(CurrencyMismatchError);
    expect(() => brl.subtract(usd)).toThrow(CurrencyMismatchError);
    expect(() => brl.equals(usd)).toThrow(CurrencyMismatchError);
  });

  it("should return valid JSON format", () => {
    const money = Money.from({ amount: "25.00", currency: "BRL" });
    expect(money.toJSON()).toEqual({ amount: "25.00", currency: "BRL" });
  });
});
