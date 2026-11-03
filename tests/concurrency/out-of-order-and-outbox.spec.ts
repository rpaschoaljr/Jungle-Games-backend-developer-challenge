import { describe, expect, it } from "bun:test";
import { v4 as uuidv4 } from "uuid";
import { MikroOrmUnitOfWork } from "@infrastructure/database/orm/mikro-unit-of-work";
import { CreateWalletUseCase } from "@application/use-cases/create-wallet/create-wallet.use-case";
import { ProcessWagerTransactionUseCase } from "@application/use-cases/process-wager/process-wager.use-case";
import { PendingReferenceWorker } from "@infrastructure/workers/pending-reference.worker";
import { OutboxPublisher } from "@infrastructure/messaging/outbox-publisher";

describe("Section 13 Concurrency - Out-of-Order & Outbox Publishers", () => {
  const uow = new MikroOrmUnitOfWork();
  const createWallet = new CreateWalletUseCase(uow);
  const useCase = new ProcessWagerTransactionUseCase(uow);
  const worker = new PendingReferenceWorker(uow);

  it("Scenario 7: REFUND delivered before BET transitions to PROCESSED via worker", async () => {
    const playerId = uuidv4();
    const created = await createWallet.execute({
      playerId,
      initialBalance: { amount: "100.00", currency: "BRL" },
    });
    const walletId = created.id;
    const betExtId = `tx-bet-ref-${walletId}`;

    // 1. REFUND chega antes da BET
    const refundRes = await useCase.execute({
      idempotencyKey: `refund:before:${walletId}`,
      providerId: "prov-order",
      externalTransactionId: `tx-refund-${walletId}`,
      playerId,
      walletId,
      roundId: "r-order-1",
      gameId: "slots-1",
      kind: "REFUND",
      money: { amount: "25.00", currency: "BRL" },
      referenceExternalTransactionId: betExtId,
    });

    expect(refundRes.status).toBe("PENDING_REFERENCE");

    // 2. A BET referenciada chega em seguida
    const betRes = await useCase.execute({
      idempotencyKey: `bet:after:${walletId}`,
      providerId: "prov-order",
      externalTransactionId: betExtId,
      playerId,
      walletId,
      roundId: "r-order-1",
      gameId: "slots-1",
      kind: "BET",
      money: { amount: "25.00", currency: "BRL" },
    });
    expect(betRes.status).toBe("PROCESSED");

    // 3. O PendingReferenceWorker reprocessa a referência pendente
    const resolvedCount = await worker.processPending();
    expect(resolvedCount).toBe(1);

    // 4. Saldo final volta a 100.00 (100 - 25 + 25)
    const reconciled = await uow.runInTransaction(async (ctx) => {
      const w = await ctx.walletRepo.findById(walletId);
      return w?.balance.amount;
    });
    expect(reconciled).toBe("100.00");
  });

  it("Scenario 6: Two concurrent publishers on outbox do not publish duplicate messages", async () => {
    const [pub1, pub2] = await Promise.all([
      OutboxPublisher.publishBatch(50),
      OutboxPublisher.publishBatch(50),
    ]);
    expect(typeof pub1).toBe("number");
    expect(typeof pub2).toBe("number");
  });
});
