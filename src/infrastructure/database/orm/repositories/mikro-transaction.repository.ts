import { EntityManager } from "@mikro-orm/core";
import { WagerTransaction } from "@domain/payment-state/wager-transaction.entity";
import { IWagerTransactionRepository } from "@application/ports/transaction.repository.interface";

export class MikroOrmTransactionRepository implements IWagerTransactionRepository {
  constructor(private readonly em: EntityManager) {}

  async create(tx: WagerTransaction): Promise<void> {
    this.em.persist(tx);
    await this.em.flush();
  }

  async save(tx: WagerTransaction): Promise<void> {
    this.em.persist(tx);
    await this.em.flush();
  }

  async update(tx: WagerTransaction): Promise<void> {
    return this.save(tx);
  }

  async findById(id: string): Promise<WagerTransaction | null> {
    return await this.em.findOne(WagerTransaction, { id });
  }

  async findByIdempotencyKey(key: string): Promise<WagerTransaction | null> {
    return await this.em.findOne(WagerTransaction, { idempotencyKey: key });
  }

  async findByExternalId(
    providerId: string,
    externalTransactionId: string
  ): Promise<WagerTransaction | null> {
    return await this.em.findOne(WagerTransaction, {
      providerId,
      externalTransactionId,
    });
  }

  async findPendingReferences(): Promise<WagerTransaction[]> {
    return await this.em.find(WagerTransaction, {
      _status: "PENDING_REFERENCE",
    } as any);
  }
}
