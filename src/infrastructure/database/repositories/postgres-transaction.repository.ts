import { Pool, PoolClient } from "pg";
import { Money } from "@domain/money/money.vo";
import {
  WagerTransaction,
  WagerTransactionKind,
  WagerTransactionStatus,
} from "@domain/payment-state/wager-transaction.entity";
import { IWagerTransactionRepository } from "@application/ports/transaction.repository.interface";

export class PostgresTransactionRepository implements IWagerTransactionRepository {
  constructor(private readonly client: Pool | PoolClient) {}

  async findById(id: string): Promise<WagerTransaction | null> {
    const res = await this.client.query(
      "SELECT * FROM wager_transactions WHERE id = $1",
      [id]
    );
    return res.rows.length ? this.mapRow(res.rows[0]) : null;
  }

  async findByExternalId(pId: string, extId: string): Promise<WagerTransaction | null> {
    const res = await this.client.query(
      "SELECT * FROM wager_transactions WHERE provider_id = $1 AND external_transaction_id = $2",
      [pId, extId]
    );
    return res.rows.length ? this.mapRow(res.rows[0]) : null;
  }

  async findByIdempotencyKey(key: string): Promise<WagerTransaction | null> {
    const res = await this.client.query(
      "SELECT * FROM wager_transactions WHERE idempotency_key = $1",
      [key]
    );
    return res.rows.length ? this.mapRow(res.rows[0]) : null;
  }

  async save(tx: WagerTransaction): Promise<void> {
    await this.client.query(
      "INSERT INTO wager_transactions " +
      "(id, provider_id, external_transaction_id, idempotency_key, payload_hash, wallet_id, " +
      "player_id, round_id, game_id, kind, amount, currency, reference_external_transaction_id, " +
      "reference_transaction_id, status, failure_code, created_at, processed_at) " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) " +
      "ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, failure_code = EXCLUDED.failure_code, " +
      "processed_at = EXCLUDED.processed_at, reference_transaction_id = EXCLUDED.reference_transaction_id",
      [
        tx.id,
        tx.providerId,
        tx.externalTransactionId,
        tx.idempotencyKey,
        tx.payloadHash,
        tx.walletId,
        tx.playerId,
        tx.roundId,
        tx.gameId,
        tx.kind,
        tx.money.amount,
        tx.money.currency,
        tx.referenceExternalTransactionId ?? null,
        tx.referenceTransactionId ?? null,
        tx.status,
        tx.failureCode ?? null,
        tx.createdAt,
        tx.processedAt ?? null,
      ]
    );
  }

  async update(tx: WagerTransaction): Promise<void> {
    await this.save(tx);
  }

  async findPendingReferences(): Promise<WagerTransaction[]> {
    const res = await this.client.query(
      "SELECT * FROM wager_transactions WHERE status = 'PENDING_REFERENCE'"
    );
    return res.rows.map((r) => this.mapRow(r));
  }

  private mapRow(row: any): WagerTransaction {
    const tx = WagerTransaction.create({
      id: row.id,
      providerId: row.provider_id,
      externalTransactionId: row.external_transaction_id,
      idempotencyKey: row.idempotency_key,
      payloadHash: row.payload_hash,
      walletId: row.wallet_id,
      playerId: row.player_id,
      roundId: row.round_id,
      gameId: row.game_id,
      kind: row.kind as WagerTransactionKind,
      money: Money.from({ amount: row.amount, currency: row.currency }),
      referenceExternalTransactionId: row.reference_external_transaction_id ?? undefined,
      createdAt: new Date(row.created_at),
    });

    if (row.status === WagerTransactionStatus.Processed) {
      tx.markProcessed(row.reference_transaction_id ?? undefined, new Date(row.processed_at));
    } else if (row.status === WagerTransactionStatus.Rejected) {
      tx.reject(row.failure_code || "REJECTED");
    } else if (row.status === WagerTransactionStatus.Failed) {
      tx.fail(row.failure_code || "FAILED");
    } else if (row.status === WagerTransactionStatus.PendingReference) {
      tx.markPendingReference();
    }
    return tx;
  }
}
