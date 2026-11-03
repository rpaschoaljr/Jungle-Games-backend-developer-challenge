import { v4 as uuidv4 } from "uuid";
import { Money } from "@domain/money/money.vo";
import {
  WagerTransaction,
  WagerTransactionKind,
} from "@domain/payment-state/wager-transaction.entity";
import { IUnitOfWork } from "@application/ports/unit-of-work.interface";
import { hashCanonicalPayload } from "@application/utils/canonical-json-hasher";
import { dispatchWagerOperation } from "./wager-dispatcher";
import { ProcessWagerInput, ProcessWagerOutput } from "./process-wager.dto";

export class ProcessWagerTransactionUseCase {
  constructor(private readonly uow: IUnitOfWork) {}

  async execute(input: ProcessWagerInput): Promise<ProcessWagerOutput> {
    const money = Money.from(input.money);
    const payloadHash = hashCanonicalPayload({
      providerId: input.providerId,
      externalTransactionId: input.externalTransactionId,
      playerId: input.playerId,
      walletId: input.walletId,
      roundId: input.roundId,
      gameId: input.gameId,
      kind: input.kind,
      money: input.money,
      refId: input.referenceExternalTransactionId,
    });

    try {
      return await this.uow.runInTransaction(async (ctx) => {
        const existing = await ctx.transactionRepo.findByIdempotencyKey(
          input.idempotencyKey
        );
        if (existing) {
          if (existing.payloadHash !== payloadHash) {
            throw new Error("IDEMPOTENCY_CONFLICT: payload mismatch");
          }
          const wallet = await ctx.walletRepo.findById(input.walletId);
          return {
            transactionId: existing.id,
            status: existing.status as any,
            failureCode: existing.failureCode,
            balance: wallet ? wallet.balance.toJSON() : input.money,
            idempotentReplay: true,
          };
        }

        const wallet = await ctx.walletRepo.findForUpdate(input.walletId);
        if (!wallet) {
          throw new Error(`Wallet not found: ${input.walletId}`);
        }

        const now = new Date();
        const tx = WagerTransaction.create({
          id: uuidv4(),
          providerId: input.providerId,
          externalTransactionId: input.externalTransactionId,
          idempotencyKey: input.idempotencyKey,
          payloadHash,
          walletId: input.walletId,
          playerId: input.playerId,
          roundId: input.roundId,
          gameId: input.gameId,
          kind: input.kind as WagerTransactionKind,
          money,
          referenceExternalTransactionId: input.referenceExternalTransactionId,
          createdAt: now,
        });

        await dispatchWagerOperation(ctx, wallet, tx, now);

        return {
          transactionId: tx.id,
          status: tx.status as any,
          failureCode: tx.failureCode,
          balance: wallet.balance.toJSON(),
          idempotentReplay: false,
        };
      });
    } catch (err: any) {
      if (
        err.message?.includes("wager_transactions_idempotency_key_key") ||
        err.code === "23505"
      ) {
        return await this.uow.runInTransaction(async (ctx) => {
          const existing = await ctx.transactionRepo.findByIdempotencyKey(
            input.idempotencyKey
          );
          if (existing) {
            const wallet = await ctx.walletRepo.findById(input.walletId);
            return {
              transactionId: existing.id,
              status: existing.status as any,
              failureCode: existing.failureCode,
              balance: wallet ? wallet.balance.toJSON() : input.money,
              idempotentReplay: true,
            };
          }
          throw err;
        });
      }
      throw err;
    }
  }
}
