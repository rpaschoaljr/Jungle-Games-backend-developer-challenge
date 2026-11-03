import { EntitySchema } from "@mikro-orm/core";
import { WagerTransaction } from "@domain/payment-state/wager-transaction.entity";
import { MoneyCustomType } from "../money.type";

export const WagerTransactionSchema = new EntitySchema<WagerTransaction>({
  class: WagerTransaction,
  tableName: "wager_transactions",
  properties: {
    id: { type: "uuid", primary: true },
    providerId: { type: "string", length: 64, fieldName: "provider_id" },
    externalTransactionId: { type: "string", length: 128, fieldName: "external_transaction_id" },
    idempotencyKey: { type: "string", length: 256, fieldName: "idempotency_key", unique: true },
    payloadHash: { type: "string", length: 64, fieldName: "payload_hash" },
    walletId: { type: "uuid", fieldName: "wallet_id" },
    playerId: { type: "uuid", fieldName: "player_id" },
    roundId: { type: "string", length: 128, fieldName: "round_id" },
    gameId: { type: "string", length: 128, fieldName: "game_id" },
    kind: { type: "string", length: 32 },
    currency: { type: "string", length: 3 },
    money: { type: MoneyCustomType, fieldName: "amount" },
    referenceExternalTransactionId: {
      type: "string",
      length: 128,
      nullable: true,
      fieldName: "reference_external_transaction_id",
    },
    createdAt: { type: "datetime", fieldName: "created_at" },
    _status: { type: "string", length: 32, fieldName: "status" },
    _referenceTransactionId: { type: "uuid", nullable: true, fieldName: "reference_transaction_id" },
    _failureCode: { type: "string", length: 64, nullable: true, fieldName: "failure_code" },
    _processedAt: { type: "datetime", nullable: true, fieldName: "processed_at" },
  },
});
