import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { DatabasePool } from "./postgres.pool";

export async function runMigrations(): Promise<void> {
  const pool = DatabasePool.getPool();
  const client = await pool.connect();
  try {
    const migrationsDir = join(__dirname, "migrations");
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), "utf-8");
      await client.query(sql);
    }
  } finally {
    client.release();
  }
}
