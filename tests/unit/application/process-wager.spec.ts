import { describe, expect, it, beforeEach } from "bun:test";
import { Money } from "@domain/money/money.vo";
import { Wallet } from "@domain/wallet/wallet.entity";
import { ProcessWagerTransactionUseCase } from "@application/use-cases/process-wager/process-wager.use-case";
import {
  TransactionalContext,
  IUnitOfWork,
} from "@application/ports/unit-of-work.interface";

class FakeUnitOfWork implements IUnitOfWork {
  wallets = new Map<string, Wallet>();
  transactions = new Map<string, any>();
  ledgers: any[] = [];

  async runInTransaction<T>(
    op: (ctx: TransactionalContext) => Promise<T>
  ): Promise<T> {
    const ctx: TransactionalContext = {
      walletRepo: {
        findById: async (id) => this.wallets.get(id) ?? null,
        findForUpdate: async (id) => this.wallets.get(id) ?? null,
        create: async (w) => { this.wallets.set(w.id, w); },
        updateBalance: async (w) => { this.wallets.set(w.id, w); },
      },
      transactionRepo: {
        findById: async (id) =>
          Array.from(this.transactions.values()).find((t) => t.id === id) ?? null,
        findByExternalId: async (pId, extId) =>
          Array.from(this.transactions.values()).find(
            (t) => t.providerId === pId && t.externalTransactionId === extId
          ) ?? null,
        findByIdempotencyKey: async (key) => this.transactions.get(key) ?? null,
        save: async (t) => { this.transactions.set(t.idempotencyKey, t); },
        update: async (t) => { this.transactions.set(t.idempotencyKey, t); },
      },
      ledgerRepo: {
        append: async (entry) => { this.ledgers.push(entry); },
        findByWalletId: async () => [],
        sumBalance: async () => 0n,
        countByWalletId: async () => 0,
      },
    };
    return await op(ctx);
  }
}

describe("ProcessWagerTransactionUseCase", () => {
  let uow: FakeUnitOfWork;
  let useCase: ProcessWagerTransactionUseCase;
  const walletId = "0192f291-27dd-7d3f-8071-5f8685deef37";
  const playerId = "0192f28f-5dc0-7d58-bdb2-814ad6a0f4a1";

  beforeEach(() => {
    uow = new FakeUnitOfWork();
    useCase = new ProcessWagerTransactionUseCase(uow);
    const initial = Money.from({ amount: "100.00", currency: "BRL" });
    uow.wallets.set(walletId, Wallet.open({ id: walletId, playerId, initialBalance: initial }));
  });

  it("should process BET and deduct from balance", async () => {
    const res = await useCase.execute({
      idempotencyKey: "prov:tx-1",
      providerId: "prov",
      externalTransactionId: "tx-1",
      playerId,
      walletId,
      roundId: "r-1",
      gameId: "g-1",
      kind: "BET",
      money: { amount: "30.00", currency: "BRL" },
    });

    expect(res.status).toBe("PROCESSED");
    expect(res.balance.amount).toBe("70.00");
    expect(res.idempotentReplay).toBe(false);
  });

  it("should return identical replay on duplicate idempotency key", async () => {
    const input = {
      idempotencyKey: "prov:tx-1",
      providerId: "prov",
      externalTransactionId: "tx-1",
      playerId,
      walletId,
      roundId: "r-1",
      gameId: "g-1",
      kind: "BET" as const,
      money: { amount: "30.00", currency: "BRL" },
    };
    await useCase.execute(input);
    const replay = await useCase.execute(input);

    expect(replay.status).toBe("PROCESSED");
    expect(replay.idempotentReplay).toBe(true);
  });

  it("should reject BET when balance is insufficient", async () => {
    const res = await useCase.execute({
      idempotencyKey: "prov:tx-excess",
      providerId: "prov",
      externalTransactionId: "tx-excess",
      playerId,
      walletId,
      roundId: "r-1",
      gameId: "g-1",
      kind: "BET",
      money: { amount: "150.00", currency: "BRL" },
    });

    expect(res.status).toBe("REJECTED");
    expect(res.failureCode).toBe("INSUFFICIENT_FUNDS");
    expect(res.balance.amount).toBe("100.00");
  });
});
