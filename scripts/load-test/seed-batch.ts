import { v4 as uuidv4 } from "uuid";

export interface SeedItem {
  walletId: string;
  playerId: string;
}

export async function seedWalletsBatch(
  pool: any,
  total: number
): Promise<SeedItem[]> {
  console.log(`⚡ Semeando ${total.toLocaleString()} carteiras no Postgres...`);
  const items: SeedItem[] = [];
  const batchSize = 2000;

  for (let i = 0; i < total; i += batchSize) {
    const currentBatch = Math.min(batchSize, total - i);
    const walletValues: string[] = [];
    const ledgerValues: string[] = [];

    for (let j = 0; j < currentBatch; j++) {
      const wId = uuidv4();
      const pId = uuidv4();
      items.push({ walletId: wId, playerId: pId });
      walletValues.push(`('${wId}', '${pId}', 'BRL', 100.00, 1, NOW(), NOW())`);
      ledgerValues.push(
        `('${uuidv4()}', '${wId}', 'SEED', 'CREDIT', 100.00, 'BRL', 0.00, 100.00, NOW())`
      );
    }

    await pool.query(
      `INSERT INTO wallets (id, player_id, currency, balance, version, created_at, updated_at) VALUES ${walletValues.join(",")}`
    );
    await pool.query(
      `INSERT INTO wallet_ledger_entries (id, wallet_id, transaction_id, direction, amount, currency, balance_before, balance_after, created_at) VALUES ${ledgerValues.join(",")}`
    );
    process.stdout.write(`\r🌱 Carteiras criadas: ${Math.min(i + batchSize, total)} / ${total}`);
  }
  console.log("\n✅ Semeamento concluído!");
  return items;
}
