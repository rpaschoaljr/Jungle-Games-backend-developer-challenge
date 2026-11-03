import { describe, expect, it, afterAll } from "bun:test";
import { v4 as uuidv4 } from "uuid";
import { DatabasePool } from "@infrastructure/database/postgres.pool";
import { PostgresUnitOfWork } from "@infrastructure/database/postgres-unit-of-work";
import { Money } from "@domain/money/money.vo";
import { Wallet } from "@domain/wallet/wallet.entity";
import {
  WalletLedgerEntry,
  LedgerDirection,
} from "@domain/wallet/ledger-entry.entity";

describe("PostgreSQL Real Integration - Atomic Transactions", () => {
  const uow = new PostgresUnitOfWork();
  const pool = DatabasePool.getPool();

  afterAll(async () => {
    // Keep pool open for further tests or don't close
  });

  it("should rollback all changes when an error is thrown inside transaction", async () => {
    const walletId = uuidv4();
    const playerId = uuidv4();
    const initial = Money.from({ amount: "100.00", currency: "BRL" });
    const wallet = Wallet.open({ id: walletId, playerId, initialBalance: initial });

    let failed = false;
    try {
      await uow.runInTransaction(async (ctx) => {
        await ctx.walletRepo.create(wallet);
        throw new Error("Simulated failure inside transaction");
      });
    } catch {
      failed = true;
    }

    expect(failed).toBe(true);

    // Verify in real postgres that wallet does NOT exist!
    const check = await pool.query("SELECT * FROM wallets WHERE id = $1", [walletId]);
    expect(check.rows.length).toBe(0);
  });

  it("should commit wallet and ledger atomically when transaction succeeds", async () => {
    const walletId = uuidv4();
    const playerId = uuidv4();
    const initial = Money.from({ amount: "500.00", currency: "BRL" });
    const wallet = Wallet.open({ id: walletId, playerId, initialBalance: initial });
    const ledgerId = uuidv4();

    await uow.runInTransaction(async (ctx) => {
      await ctx.walletRepo.create(wallet);
      const entry = WalletLedgerEntry.create({
        id: ledgerId,
        walletId,
        transactionId: "OPENING_INTEGRATION",
        direction: LedgerDirection.Credit,
        money: initial,
        balanceBefore: Money.zero("BRL"),
        balanceAfter: initial,
        createdAt: new Date(),
      });
      await ctx.ledgerRepo.append(entry);
    });

    const walletRow = await pool.query("SELECT * FROM wallets WHERE id = $1", [walletId]);
    const ledgerRow = await pool.query(
      "SELECT * FROM wallet_ledger_entries WHERE id = $1",
      [ledgerId]
    );

    expect(walletRow.rows.length).toBe(1);
    expect(walletRow.rows[0].balance).toBe("500.00");
    expect(ledgerRow.rows.length).toBe(1);
    expect(ledgerRow.rows[0].amount).toBe("500.00");
  });
});
