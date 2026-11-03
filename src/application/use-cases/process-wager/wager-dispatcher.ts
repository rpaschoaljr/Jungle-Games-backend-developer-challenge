import { v4 as uuidv4 } from "uuid";
import { Wallet } from "@domain/wallet/wallet.entity";
import { applyDebit } from "@domain/wallet/operations/apply-debit";
import { applyCredit } from "@domain/wallet/operations/apply-credit";
import {
  WagerTransaction,
  WagerTransactionKind,
} from "@domain/payment-state/wager-transaction.entity";
import { TransactionalContext } from "@application/ports/unit-of-work.interface";
import { handleRollback } from "./rollback-handler";
import { buildWagerOutboxEntry } from "./outbox-event-builder";

export async function dispatchWagerOperation(
  ctx: TransactionalContext,
  wallet: Wallet,
  tx: WagerTransaction,
  now: Date
): Promise<void> {
  if (tx.kind === WagerTransactionKind.Bet) {
    if (wallet.balance.isLessThan(tx.money)) {
      tx.reject("INSUFFICIENT_FUNDS");
      await ctx.transactionRepo.save(tx);
      if (ctx.outboxRepo) await ctx.outboxRepo.append(buildWagerOutboxEntry(wallet, tx, now));
      return;
    }
    const { ledgerEntry } = applyDebit({
      wallet,
      money: tx.money,
      transactionId: tx.id,
      entryId: uuidv4(),
      now,
    });
    await ctx.walletRepo.updateBalance(wallet);
    await ctx.ledgerRepo.append(ledgerEntry);
    tx.markProcessed(undefined, now);
    await ctx.transactionRepo.save(tx);
  } else if (tx.kind === WagerTransactionKind.Win) {
    const { ledgerEntry } = applyCredit({
      wallet,
      money: tx.money,
      transactionId: tx.id,
      entryId: uuidv4(),
      now,
    });
    await ctx.walletRepo.updateBalance(wallet);
    await ctx.ledgerRepo.append(ledgerEntry);
    tx.markProcessed(undefined, now);
    await ctx.transactionRepo.save(tx);
  } else if (tx.kind === WagerTransactionKind.Loss) {
    tx.markProcessed(undefined, now);
    await ctx.transactionRepo.save(tx);
  } else if (tx.kind === WagerTransactionKind.Refund) {
    await handleRefund(ctx, wallet, tx, now);
  } else if (tx.kind === WagerTransactionKind.Rollback) {
    await handleRollback(ctx, wallet, tx, now);
  }

  if (ctx.outboxRepo) {
    await ctx.outboxRepo.append(buildWagerOutboxEntry(wallet, tx, now));
  }
}

async function handleRefund(
  ctx: TransactionalContext,
  wallet: Wallet,
  tx: WagerTransaction,
  now: Date
): Promise<void> {
  const ref = await ctx.transactionRepo.findByExternalId(
    tx.providerId,
    tx.referenceExternalTransactionId!
  );
  if (!ref || !ref.isTerminal()) {
    tx.markPendingReference();
    await ctx.transactionRepo.save(tx);
    return;
  }
  const { ledgerEntry } = applyCredit({
    wallet,
    money: tx.money,
    transactionId: tx.id,
    entryId: uuidv4(),
    now,
  });
  await ctx.walletRepo.updateBalance(wallet);
  await ctx.ledgerRepo.append(ledgerEntry);
  tx.markProcessed(ref.id, now);
  await ctx.transactionRepo.save(tx);
}
