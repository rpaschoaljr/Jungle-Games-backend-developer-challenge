import { EntitySchema } from "@mikro-orm/core";
import { Wallet } from "@domain/wallet/wallet.entity";
import { MoneyCustomType } from "../money.type";

export const WalletSchema = new EntitySchema<Wallet>({
  class: Wallet,
  tableName: "wallets",
  properties: {
    id: { type: "uuid", primary: true },
    playerId: { type: "uuid", fieldName: "player_id" },
    currency: { type: "string", length: 3 },
    _balance: { type: MoneyCustomType, fieldName: "balance" },
    _version: { type: "integer", fieldName: "version" },
    createdAt: { type: "datetime", fieldName: "created_at" },
    _updatedAt: { type: "datetime", fieldName: "updated_at" },
  },
});
