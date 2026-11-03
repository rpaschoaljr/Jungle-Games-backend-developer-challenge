import { DatabasePool } from "../postgres.pool";

export async function runDevSeeds(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    console.log("[SEED] Skipped: Production environment detected.");
    return;
  }

  const pool = DatabasePool.getPool();
  const client = await pool.connect();

  try {
    console.log("[SEED] Seeding dev wallets in PostgreSQL...");

    const wallets = [
      {
        id: "a1a1a1a1-1111-4000-8000-000000000001",
        ledgerId: "c1c1c1c1-1111-4000-8000-000000000001",
        playerId: "0192f28f-5dc0-7d58-bdb2-814ad6a0f4a1",
        currency: "BRL",
        balance: "1000.00",
      },
      {
        id: "b2b2b2b2-2222-4000-8000-000000000002",
        ledgerId: "c2c2c2c2-2222-4000-8000-000000000002",
        playerId: "0192f28f-5dc0-7d58-bdb2-814ad6a0f4a2",
        currency: "BRL",
        balance: "500.00",
      },
    ];

    for (const w of wallets) {
      await client.query(
        "INSERT INTO wallets (id, player_id, currency, balance, version, created_at, updated_at) " +
        "VALUES ($1, $2, $3, $4, 1, NOW(), NOW()) " +
        "ON CONFLICT (id) DO NOTHING",
        [w.id, w.playerId, w.currency, w.balance]
      );

      await client.query(
        "INSERT INTO wallet_ledger_entries " +
        "(id, wallet_id, transaction_id, direction, amount, currency, balance_before, balance_after, created_at) " +
        "VALUES ($1, $2, $3, 'CREDIT', $4, $5, '0.00', $4, NOW()) " +
        "ON CONFLICT (id) DO NOTHING",
        [w.ledgerId, w.id, "OPENING_SEED", w.balance, w.currency]
      );
    }

    console.log("[SEED] Dev wallets seeded successfully!");
  } finally {
    client.release();
  }
}
