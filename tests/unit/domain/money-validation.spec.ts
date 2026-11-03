import { describe, expect, it } from "bun:test";
import { Money } from "@domain/money/money.vo";
import { InvalidMoneyError } from "@domain/money/money.errors";

describe("Money Value Object - Validations", () => {
  it("should create valid Money with 2 decimal places", () => {
    const money = Money.from({ amount: "25.00", currency: "BRL" });
    expect(money.amount).toBe("25.00");
    expect(money.currency).toBe("BRL");
  });

  it("should reject number type inputs instead of string", () => {
    expect(() =>
      Money.from({ amount: 25.0 as unknown as string, currency: "BRL" })
    ).toThrow(InvalidMoneyError);
  });

  it("should reject negative amounts in constructor props", () => {
    expect(() =>
      Money.from({ amount: "-10.00", currency: "BRL" })
    ).toThrow(InvalidMoneyError);
  });

  it("should reject amounts with more than 2 decimal places", () => {
    expect(() =>
      Money.from({ amount: "25.001", currency: "BRL" })
    ).toThrow(InvalidMoneyError);
  });

  it("should reject amounts with comma instead of dot", () => {
    expect(() =>
      Money.from({ amount: "25,00", currency: "BRL" })
    ).toThrow(InvalidMoneyError);
  });

  it("should reject non-numeric strings, NaN and Infinity", () => {
    const invalidValues = ["NaN", "Infinity", "-Infinity", "abc", "", "  "];
    for (const val of invalidValues) {
      expect(() =>
        Money.from({ amount: val, currency: "BRL" })
      ).toThrow(InvalidMoneyError);
    }
  });

  it("should reject scientific notation", () => {
    expect(() =>
      Money.from({ amount: "1e5", currency: "BRL" })
    ).toThrow(InvalidMoneyError);
  });

  it("should reject SQL injection or malicious characters in amount", () => {
    const malicious = [
      "' OR '1'='1",
      "10.00; DROP TABLE wallets;",
      "<script>alert(1)</script>",
      "10.00\0"
    ];
    for (const mal of malicious) {
      expect(() =>
        Money.from({ amount: mal, currency: "BRL" })
      ).toThrow(InvalidMoneyError);
    }
  });
});
