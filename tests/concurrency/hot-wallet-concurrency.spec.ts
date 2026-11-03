import { describe, expect, it } from "bun:test";
import { v4 as uuidv4 } from "uuid";
import { DatabasePool } from "@infrastructure/database/postgres.pool";
import { MikroOrmUnitOfWork } from "@infrastructure/database/orm/mikro-unit-of-work";
import { CreateWalletUseCase } from "@application/use-cases/create-wallet/create-wallet.use-case";
import { ProcessWagerTransactionUseCase } from "@application/use-cases/process-wager/process-wager.use-case";

describe("Concurrency & Load Tests - Real PostgreSQL 19 with MikroORM", () => {
  const uow = new MikroOrmUnitOfWork();
  const pool = DatabasePool.getPool();
  const createWallet = new CreateWalletUseCase(uow);
  const useCase = new ProcessWagerTransactionUseCase(uow);

  it("Section 8 Scenario: 2 concurrent bets of 80.00 on 100.00 balance", async () => {
    const playerId = uuidv4();
    const created = await createWallet.execute({
      playerId,
      initialBalance: { amount: "100.00", currency: "BRL" },
    });
    const walletId = created.id;

    const [res1, res2] = await Promise.all([
      useCase.execute({
        idempotencyKey: `race:bet-1:${walletId}`,
        providerId: "prov-race",
        externalTransactionId: `tx-race-1-${walletId}`,
        playerId,
        walletId,
        roundId: "r-1",
        gameId: "g-1",
        kind: "BET",
        money: { amount: "80.00", currency: "BRL" },
      }),
      useCase.execute({
        idempotencyKey: `race:bet-2:${walletId}`,
        providerId: "prov-race",
        externalTransactionId: `tx-race-2-${walletId}`,
        playerId,
        walletId,
        roundId: "r-1",
        gameId: "g-1",
        kind: "BET",
        money: { amount: "80.00", currency: "BRL" },
      }),
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain("PROCESSED");
    expect(statuses).toContain("REJECTED");
    const rejected = res1.status === "REJECTED" ? res1 : res2;
    expect(rejected.failureCode).toBe("INSUFFICIENT_FUNDS");

    const walletRow = await pool.query("SELECT * FROM wallets WHERE id = $1", [walletId]);
    expect(walletRow.rows[0].balance).toBe("20.00");

    const ledgerRows = await pool.query(
      "SELECT * FROM wallet_ledger_entries WHERE wallet_id = $1 ORDER BY created_at ASC",
      [walletId]
    );
    expect(ledgerRows.rows.length).toBe(2);
    expect(ledgerRows.rows[0].direction).toBe("CREDIT");
    expect(ledgerRows.rows[0].amount).toBe("100.00");
    expect(ledgerRows.rows[1].direction).toBe("DEBIT");
    expect(ledgerRows.rows[1].amount).toBe("80.00");
  });

  it("Section 13 Scenario: Same bet sent 50 times concurrently produces 1 debit", async () => {
    const playerId = uuidv4();
    const created = await createWallet.execute({
      playerId,
      initialBalance: { amount: "100.00", currency: "BRL" },
    });
    const walletId = created.id;

    const idempotencyKey = `dup:bet-50:${walletId}`;
    const externalTransactionId = `tx-dup-50-${walletId}`;

    const promises = Array.from({ length: 50 }, () =>
      useCase.execute({
        idempotencyKey,
        providerId: "prov-dup",
        externalTransactionId,
        playerId,
        walletId,
        roundId: "r-dup",
        gameId: "g-dup",
        kind: "BET",
        money: { amount: "25.00", currency: "BRL" },
      })
    );

    const results = await Promise.all(promises);
    for (const r of results) {
      expect(r.status).toBe("PROCESSED");
    }

    const replays = results.filter((r) => r.idempotentReplay);
    expect(replays.length).toBe(49);

    const walletRow = await pool.query("SELECT * FROM wallets WHERE id = $1", [walletId]);
    expect(walletRow.rows[0].balance).toBe("75.00");

    const ledgerRows = await pool.query(
      "SELECT * FROM wallet_ledger_entries WHERE wallet_id = $1 ORDER BY created_at ASC",
      [walletId]
    );
    expect(ledgerRows.rows.length).toBe(2);
    expect(ledgerRows.rows[0].direction).toBe("CREDIT");
    expect(ledgerRows.rows[0].amount).toBe("100.00");
    expect(ledgerRows.rows[1].direction).toBe("DEBIT");
    expect(ledgerRows.rows[1].amount).toBe("25.00");
  });
});
