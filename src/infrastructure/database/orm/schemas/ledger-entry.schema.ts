import { EntitySchema } from "@mikro-orm/core";
import { WalletLedgerEntry } from "@domain/wallet/ledger-entry.entity";
import { MoneyCustomType } from "../money.type";

export const WalletLedgerEntrySchema = new EntitySchema<WalletLedgerEntry>({
  class: WalletLedgerEntry,
  tableName: "wallet_ledger_entries",
  properties: {
    id: { type: "uuid", primary: true },
    walletId: { type: "uuid", fieldName: "wallet_id" },
    transactionId: { type: "string", length: 128, fieldName: "transaction_id" },
    direction: { type: "string", length: 10 },
    currency: { type: "string", length: 3 },
    money: { type: MoneyCustomType, fieldName: "amount" },
    balanceBefore: { type: MoneyCustomType, fieldName: "balance_before" },
    balanceAfter: { type: MoneyCustomType, fieldName: "balance_after" },
    createdAt: { type: "datetime", fieldName: "created_at" },
  },
});
