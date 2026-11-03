import { v4 as uuidv4 } from "uuid";
import { Wallet } from "@domain/wallet/wallet.entity";
import { WagerTransaction } from "@domain/payment-state/wager-transaction.entity";
import { OutboxEntry } from "@application/ports/outbox.repository.interface";
import { WagerTransactionProcessed } from "@domain/events/wager-transaction-processed.event";
import { WagerTransactionRejected } from "@domain/events/wager-transaction-rejected.event";
import { WagerTransactionPendingReference } from "@domain/events/wager-pending-reference.event";

export function buildWagerOutboxEntry(
  wallet: Wallet,
  tx: WagerTransaction,
  now: Date
): OutboxEntry {
  const eventId = uuidv4();
  let event: any;

  if (tx.status === "PROCESSED") {
    event = WagerTransactionProcessed.create({
      eventId,
      aggregateId: wallet.id,
      correlationId: tx.id,
      occurredAt: now,
      data: {
        transactionId: tx.id,
        walletId: wallet.id,
        playerId: wallet.playerId,
        roundId: tx.roundId,
        gameId: tx.gameId,
        kind: tx.kind,
        money: tx.money.toJSON(),
        balance: wallet.balance.toJSON(),
        referenceTransactionId: tx.referenceTransactionId,
      },
    });
  } else if (tx.status === "PENDING_REFERENCE") {
    event = WagerTransactionPendingReference.create({
      eventId,
      aggregateId: wallet.id,
      correlationId: tx.id,
      occurredAt: now,
      data: {
        transactionId: tx.id,
        walletId: wallet.id,
        providerId: tx.providerId,
        referenceExternalTransactionId: tx.referenceExternalTransactionId || "",
        kind: tx.kind,
      },
    });
  } else {
    event = WagerTransactionRejected.create({
      eventId,
      aggregateId: wallet.id,
      correlationId: tx.id,
      occurredAt: now,
      data: {
        transactionId: tx.id,
        walletId: wallet.id,
        playerId: wallet.playerId,
        roundId: tx.roundId,
        gameId: tx.gameId,
        kind: tx.kind,
        money: tx.money.toJSON(),
        failureCode: tx.failureCode || "REJECTED",
      },
    });
  }

  return {
    id: eventId,
    aggregateId: wallet.id,
    eventType: event.eventType,
    payload: event.toJSON(),
    occurredAt: now,
  };
}
