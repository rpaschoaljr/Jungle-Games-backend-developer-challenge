import { Options } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { WalletSchema } from "./schemas/wallet.schema";
import { WalletLedgerEntrySchema } from "./schemas/ledger-entry.schema";
import { WagerTransactionSchema } from "./schemas/transaction.schema";
import { OutboxSchema } from "./schemas/outbox.schema";
import { InboxSchema } from "./schemas/inbox.schema";

export const mikroOrmConfig: Options<PostgreSqlDriver> = {
  driver: PostgreSqlDriver,
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "jungle_user",
  password: process.env.DB_PASSWORD || "jungle_secret",
  dbName: process.env.DB_NAME || "jungle_wagering",
  entities: [
    WalletSchema,
    WalletLedgerEntrySchema,
    WagerTransactionSchema,
    OutboxSchema,
    InboxSchema,
  ],
  pool: {
    min: 2,
    max: 50,
  },
  discovery: { warnWhenCannotUseEntities: false },
};

export default mikroOrmConfig;
