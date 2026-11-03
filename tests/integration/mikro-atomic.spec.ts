import { describe, expect, it } from "bun:test";
import { v4 as uuidv4 } from "uuid";
import { MikroOrmUnitOfWork } from "@infrastructure/database/orm/mikro-unit-of-work";
import { CreateWalletUseCase } from "@application/use-cases/create-wallet/create-wallet.use-case";
import { ProcessWagerTransactionUseCase } from "@application/use-cases/process-wager/process-wager.use-case";

describe("MikroORM Real Integration - Atomic Transactions", () => {
  const uow = new MikroOrmUnitOfWork();
  const createWallet = new CreateWalletUseCase(uow);
  const processWager = new ProcessWagerTransactionUseCase(uow);

  it("should create wallet and record opening ledger via MikroORM", async () => {
    const playerId = uuidv4();
    const created = await createWallet.execute({
      playerId,
      initialBalance: { amount: "100.00", currency: "BRL" },
    });

    expect(created.id).toBeDefined();
    expect(created.balance.amount).toBe("100.00");

    const betRes = await processWager.execute({
      idempotencyKey: `mikro:bet:${created.id}`,
      providerId: "prov-mikro",
      externalTransactionId: `tx-mikro-${created.id}`,
      playerId,
      walletId: created.id,
      roundId: "r-mikro",
      gameId: "g-mikro",
      kind: "BET",
      money: { amount: "30.00", currency: "BRL" },
    });

    expect(betRes.status).toBe("PROCESSED");
    expect(betRes.balance.amount).toBe("70.00");
  });

  it("should rollback all changes when an error is thrown inside transaction", async () => {
    const playerId = uuidv4();
    const walletId = uuidv4();
    try {
      await uow.runInTransaction(async (ctx) => {
        const w = Wallet.open({
          id: walletId,
          playerId,
          initialBalance: Money.from({ amount: "50.00", currency: "BRL" }),
        });
        await ctx.walletRepo.create(w);
        throw new Error("Simulated rollback failure");
      });
    } catch {
      // Expected
    }

    const found = await uow.runInTransaction(async (ctx) => {
      return await ctx.walletRepo.findById(walletId);
    });
    expect(found).toBeNull();
  });
});
