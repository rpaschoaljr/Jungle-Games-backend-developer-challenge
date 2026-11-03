import { IWalletRepository } from "./wallet.repository.interface";
import { IWagerTransactionRepository } from "./transaction.repository.interface";
import { ILedgerRepository } from "./ledger.repository.interface";
import { IOutboxRepository } from "./outbox.repository.interface";

export interface TransactionalContext {
  walletRepo: IWalletRepository;
  transactionRepo: IWagerTransactionRepository;
  ledgerRepo: ILedgerRepository;
  outboxRepo: IOutboxRepository;
}

export interface IUnitOfWork {
  runInTransaction<T>(
    operation: (ctx: TransactionalContext) => Promise<T>
  ): Promise<T>;
}
