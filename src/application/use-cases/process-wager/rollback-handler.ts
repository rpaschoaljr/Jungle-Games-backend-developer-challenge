import { v4 as uuidv4 } from "uuid";
import { Wallet } from "@domain/wallet/wallet.entity";
import { applyDebit } from "@domain/wallet/operations/apply-debit";
import { applyCredit } from "@domain/wallet/operations/apply-credit";
import {
  WagerTransaction,
  WagerTransactionKind,
} from "@domain/payment-state/wager-transaction.entity";
import { TransactionalContext } from "@application/ports/unit-of-work.interface";

export async function handleRollback(
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

  // Se a referência era ganho (WIN), o rollback desfaz DEBITANDO
  if (ref.kind === WagerTransactionKind.Win) {
    if (wallet.balance.isLessThan(tx.money)) {
      tx.reject("REVERSAL_WOULD_CAUSE_NEGATIVE_BALANCE");
      await ctx.transactionRepo.save(tx);
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
    tx.markProcessed(ref.id, now);
    await ctx.transactionRepo.save(tx);
  } else {
    // Se a referência era débito (BET), o rollback CREDITA de volta
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
}
