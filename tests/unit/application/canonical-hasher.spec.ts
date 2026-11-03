import { describe, expect, it } from "bun:test";
import { hashCanonicalPayload } from "@application/utils/canonical-json-hasher";

describe("Canonical JSON Hasher", () => {
  it("should produce identical hashes for objects with different key order", () => {
    const obj1 = {
      providerId: "prov-1",
      walletId: "w-1",
      kind: "BET",
      money: { amount: "25.00", currency: "BRL" },
    };
    const obj2 = {
      kind: "BET",
      money: { currency: "BRL", amount: "25.00" },
      walletId: "w-1",
      providerId: "prov-1",
    };

    const hash1 = hashCanonicalPayload(obj1);
    const hash2 = hashCanonicalPayload(obj2);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it("should produce different hashes for different payloads", () => {
    const obj1 = { amount: "25.00", kind: "BET" };
    const obj2 = { amount: "30.00", kind: "BET" };

    expect(hashCanonicalPayload(obj1)).not.toBe(hashCanonicalPayload(obj2));
  });
});
