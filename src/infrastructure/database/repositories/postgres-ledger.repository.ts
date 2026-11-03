import { Pool, PoolClient } from "pg";
import { Money } from "@domain/money/money.vo";
import {
  WalletLedgerEntry,
  LedgerDirection,
} from "@domain/wallet/ledger-entry.entity";
import { ILedgerRepository } from "@application/ports/ledger.repository.interface";

export class PostgresLedgerRepository implements ILedgerRepository {
  constructor(private readonly client: Pool | PoolClient) {}

  async append(entry: WalletLedgerEntry): Promise<void> {
    await this.client.query(
      "INSERT INTO wallet_ledger_entries " +
      "(id, wallet_id, transaction_id, direction, amount, currency, balance_before, balance_after, created_at) " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [
        entry.id,
        entry.walletId,
        entry.transactionId,
        entry.direction,
        entry.money.amount,
        entry.money.currency,
        entry.balanceBefore.amount,
        entry.balanceAfter.amount,
        entry.createdAt,
      ]
    );
  }

  async findByWalletId(
    walletId: string,
    limit: number,
    cursor?: string
  ): Promise<WalletLedgerEntry[]> {
    let query =
      "SELECT id, wallet_id, transaction_id, direction, amount, currency, balance_before, balance_after, created_at " +
      "FROM wallet_ledger_entries WHERE wallet_id = $1 ";
    const params: any[] = [walletId];

    if (cursor) {
      query += "AND created_at < $2 ORDER BY created_at DESC LIMIT $3";
      params.push(new Date(cursor), limit);
    } else {
      query += "ORDER BY created_at DESC LIMIT $2";
      params.push(limit);
    }

    const res = await this.client.query(query, params);
    return res.rows.map((row) =>
      WalletLedgerEntry.rehydrate({
        id: row.id,
        walletId: row.wallet_id,
        transactionId: row.transaction_id,
        direction: row.direction as LedgerDirection,
        money: Money.from({ amount: row.amount, currency: row.currency }),
        balanceBefore: Money.from({ amount: row.balance_before, currency: row.currency }),
        balanceAfter: Money.from({ amount: row.balance_after, currency: row.currency }),
        createdAt: new Date(row.created_at),
      })
    );
  }

  async sumBalance(walletId: string): Promise<bigint> {
    const res = await this.client.query(
      "SELECT COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE -amount END), 0) AS total " +
      "FROM wallet_ledger_entries WHERE wallet_id = $1",
      [walletId]
    );
    const amountStr = res.rows[0]?.total?.toString() || "0.00";
    const money = Money.from({ amount: amountStr, currency: "BRL" });
    return money.toCents();
  }

  async countByWalletId(walletId: string): Promise<number> {
    const res = await this.client.query(
      "SELECT COUNT(*) AS total FROM wallet_ledger_entries WHERE wallet_id = $1",
      [walletId]
    );
    return Number(res.rows[0]?.total || 0);
  }
}
