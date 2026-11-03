import { DatabasePool } from "./postgres.pool";
import {
  IUnitOfWork,
  TransactionalContext,
} from "@application/ports/unit-of-work.interface";
import { PostgresWalletRepository } from "./repositories/postgres-wallet.repository";
import { PostgresTransactionRepository } from "./repositories/postgres-transaction.repository";
import { PostgresLedgerRepository } from "./repositories/postgres-ledger.repository";
import { PostgresOutboxRepository } from "./repositories/postgres-outbox.repository";

export class PostgresUnitOfWork implements IUnitOfWork {
  async runInTransaction<T>(
    operation: (ctx: TransactionalContext) => Promise<T>
  ): Promise<T> {
    const pool = DatabasePool.getPool();
    const client = await pool.connect();
    let hasError = false;

    try {
      await client.query("BEGIN");
      const ctx: TransactionalContext = {
        walletRepo: new PostgresWalletRepository(client),
        transactionRepo: new PostgresTransactionRepository(client),
        ledgerRepo: new PostgresLedgerRepository(client),
        outboxRepo: new PostgresOutboxRepository(client),
      };
      const result = await operation(ctx);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      hasError = true;
      try {
        await client.query("ROLLBACK");
      } catch {
        // Se o banco caiu, o socket quebrou e o rollback é implícito no Postgres
      }
      throw err;
    } finally {
      client.release(hasError);
    }
  }
}
