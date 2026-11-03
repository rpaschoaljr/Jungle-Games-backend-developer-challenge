import { WagerTransaction } from "@domain/payment-state/wager-transaction.entity";

export interface IWagerTransactionRepository {
  findById(id: string): Promise<WagerTransaction | null>;
  findByExternalId(
    providerId: string,
    externalTransactionId: string
  ): Promise<WagerTransaction | null>;
  findByIdempotencyKey(key: string): Promise<WagerTransaction | null>;
  findPendingReferences(): Promise<WagerTransaction[]>;
  save(transaction: WagerTransaction): Promise<void>;
  update(transaction: WagerTransaction): Promise<void>;
}
