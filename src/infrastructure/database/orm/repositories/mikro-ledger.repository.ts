import { EntityManager } from "@mikro-orm/core";
import { Money } from "@domain/money/money.vo";
import { WalletLedgerEntry } from "@domain/wallet/ledger-entry.entity";
import { ILedgerRepository } from "@application/ports/ledger.repository.interface";

export class MikroOrmLedgerRepository implements ILedgerRepository {
  constructor(private readonly em: EntityManager) {}

  async append(entry: WalletLedgerEntry): Promise<void> {
    this.em.persist(entry);
    await this.em.flush();
  }

  async findByWalletId(
    walletId: string,
    limit: number,
    cursor?: string
  ): Promise<WalletLedgerEntry[]> {
    const where: any = { walletId };
    if (cursor) {
      where.createdAt = { $lt: new Date(cursor) };
    }
    return await this.em.find(WalletLedgerEntry, where, {
      orderBy: { createdAt: "DESC" },
      limit,
    });
  }

  async sumBalance(walletId: string): Promise<bigint> {
    const qb = this.em.getKnex();
    const res = await qb("wallet_ledger_entries")
      .where("wallet_id", walletId)
      .select(
        qb.raw(
          "COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE -amount END), 0) AS total"
        )
      );
    const amountStr = res[0]?.total?.toString() || "0.00";
    const money = Money.from({ amount: amountStr, currency: "BRL" });
    return money.toCents();
  }

  async countByWalletId(walletId: string): Promise<number> {
    return await this.em.count(WalletLedgerEntry, { walletId });
  }
}
