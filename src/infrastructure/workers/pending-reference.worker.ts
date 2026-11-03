import { v4 as uuidv4 } from "uuid";
import { IUnitOfWork } from "@application/ports/unit-of-work.interface";
import { WagerTransactionKind } from "@domain/payment-state/wager-transaction.types";
import { applyCredit } from "@domain/wallet/operations/apply-credit";
import { applyDebit } from "@domain/wallet/operations/apply-debit";
import { buildWagerOutboxEntry } from "@application/use-cases/process-wager/outbox-event-builder";

export class PendingReferenceWorker {
  constructor(private readonly uow: IUnitOfWork) {}

  async processPending(ttlMs = 300000): Promise<number> {
    return await this.uow.runInTransaction(async (ctx) => {
      const pending = await (ctx.transactionRepo as any).findPendingReferences?.() || [];
      let processed = 0;
      const now = new Date();

      for (const tx of pending) {
        const ref = await ctx.transactionRepo.findByExternalId(
          tx.providerId,
          tx.referenceExternalTransactionId!
        );

        if (ref && ref.isTerminal()) {
          const wallet = await ctx.walletRepo.findForUpdate(tx.walletId);
          if (!wallet) continue;

          if (tx.kind === WagerTransactionKind.Refund || (tx.kind === WagerTransactionKind.Rollback && ref.kind === WagerTransactionKind.Bet)) {
            const { ledgerEntry } = applyCredit({
              wallet,
              money: tx.money,
              transactionId: tx.id,
              entryId: uuidv4(),
              now,
            });
            await ctx.walletRepo.updateBalance(wallet);
            await ctx.ledgerRepo.append(ledgerEntry);
          } else if (tx.kind === WagerTransactionKind.Rollback && ref.kind === WagerTransactionKind.Win) {
            const { ledgerEntry } = applyDebit({
              wallet,
              money: tx.money,
              transactionId: tx.id,
              entryId: uuidv4(),
              now,
            });
            await ctx.walletRepo.updateBalance(wallet);
            await ctx.ledgerRepo.append(ledgerEntry);
          }

          tx.markProcessed(ref.id, now);
          await ctx.transactionRepo.save(tx);
          if (ctx.outboxRepo) await ctx.outboxRepo.append(buildWagerOutboxEntry(wallet, tx, now));
          processed++;
        } else if (now.getTime() - tx.createdAt.getTime() > ttlMs) {
          tx.reject("REFERENCE_NOT_FOUND");
          await ctx.transactionRepo.save(tx);
          const wallet = await ctx.walletRepo.findById(tx.walletId);
          if (wallet && ctx.outboxRepo) {
            await ctx.outboxRepo.append(buildWagerOutboxEntry(wallet, tx, now));
          }
          processed++;
        }
      }
      return processed;
    });
  }
}
