import { Pool, PoolClient } from "pg";
import { Money } from "@domain/money/money.vo";
import { Wallet } from "@domain/wallet/wallet.entity";
import { IWalletRepository } from "@application/ports/wallet.repository.interface";

export class PostgresWalletRepository implements IWalletRepository {
  constructor(private readonly client: Pool | PoolClient) {}

  async findById(id: string): Promise<Wallet | null> {
    const res = await this.client.query(
      "SELECT id, player_id, currency, balance, version, created_at, updated_at " +
      "FROM wallets WHERE id = $1",
      [id]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToWallet(res.rows[0]);
  }

  async findForUpdate(id: string): Promise<Wallet | null> {
    const res = await this.client.query(
      "SELECT id, player_id, currency, balance, version, created_at, updated_at " +
      "FROM wallets WHERE id = $1 FOR UPDATE",
      [id]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToWallet(res.rows[0]);
  }

  async findAll(): Promise<Wallet[]> {
    const res = await this.client.query(
      "SELECT id, player_id, currency, balance, version, created_at, updated_at " +
      "FROM wallets ORDER BY created_at ASC"
    );
    return res.rows.map((row) => this.mapRowToWallet(row));
  }

  async create(wallet: Wallet): Promise<void> {
    await this.client.query(
      "INSERT INTO wallets (id, player_id, currency, balance, version, created_at, updated_at) " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        wallet.id,
        wallet.playerId,
        wallet.currency,
        wallet.balance.amount,
        wallet.version,
        wallet.createdAt,
        wallet.updatedAt,
      ]
    );
  }

  async updateBalance(wallet: Wallet): Promise<void> {
    const res = await this.client.query(
      "UPDATE wallets SET balance = $1, version = $2, updated_at = $3 " +
      "WHERE id = $4 AND version = $5",
      [
        wallet.balance.amount,
        wallet.version,
        wallet.updatedAt,
        wallet.id,
        wallet.version - 1,
      ]
    );
    if (res.rowCount === 0) {
      throw new Error(`Optimistic concurrency conflict on wallet ${wallet.id}`);
    }
  }

  private mapRowToWallet(row: any): Wallet {
    return Wallet.rehydrate({
      id: row.id,
      playerId: row.player_id,
      currency: row.currency,
      balance: Money.from({ amount: row.balance, currency: row.currency }),
      version: Number(row.version),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
