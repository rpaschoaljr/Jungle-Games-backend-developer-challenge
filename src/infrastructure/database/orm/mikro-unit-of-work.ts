import { EntityManager } from "@mikro-orm/core";
import {
  IUnitOfWork,
  TransactionalContext,
} from "@application/ports/unit-of-work.interface";
import { MikroOrmManager } from "./mikro-orm-manager";
import { MikroOrmWalletRepository } from "./repositories/mikro-wallet.repository";
import { MikroOrmTransactionRepository } from "./repositories/mikro-transaction.repository";
import { MikroOrmLedgerRepository } from "./repositories/mikro-ledger.repository";
import { MikroOrmOutboxRepository } from "./repositories/mikro-outbox.repository";

export class MikroOrmUnitOfWork implements IUnitOfWork {
  constructor(private readonly em?: EntityManager) {}

  async runInTransaction<T>(
    operation: (ctx: TransactionalContext) => Promise<T>
  ): Promise<T> {
    const baseEm = this.em || (await MikroOrmManager.getOrm()).em.fork();
    return await baseEm.transactional(async (txEm) => {
      const ctx: TransactionalContext = {
        walletRepo: new MikroOrmWalletRepository(txEm),
        transactionRepo: new MikroOrmTransactionRepository(txEm),
        ledgerRepo: new MikroOrmLedgerRepository(txEm),
        outboxRepo: new MikroOrmOutboxRepository(txEm),
      };
      return await operation(ctx);
    });
  }
}
