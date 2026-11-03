import { DatabasePool } from "../../src/infrastructure/database/postgres.pool";

export interface AuditResult {
  totalWalletsAudited: number;
  negativeBalancesFound: number;
  ledgerDiscrepanciesFound: number;
  crossContaminations: number;
  isConsistent: boolean;
}

export async function verifyAudit(): Promise<AuditResult> {
  const pool = DatabasePool.getPool();

  console.log("🔍 [AUDIT] Iniciando auditoria forense no PostgreSQL 19...");

  const countRes = await pool.query("SELECT COUNT(*) AS total FROM wallets");
  const totalWallets = Number(countRes.rows[0].total);

  const negRes = await pool.query(
    "SELECT COUNT(*) AS total FROM wallets WHERE balance < 0"
  );
  const negativeBalances = Number(negRes.rows[0].total);

  const discRes = await pool.query(
    "SELECT COUNT(*) AS total FROM wallets w " +
    "JOIN ( " +
    "  SELECT wallet_id, " +
    "  SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE -amount END) AS sum " +
    "  FROM wallet_ledger_entries GROUP BY wallet_id " +
    ") l ON w.id = l.wallet_id " +
    "WHERE w.balance != l.sum"
  );
  const discrepancies = Number(discRes.rows[0].total);

  const crossRes = await pool.query(
    "SELECT COUNT(*) AS total FROM wallet_ledger_entries e " +
    "JOIN wallets w ON e.wallet_id = w.id " +
    "WHERE e.currency != w.currency"
  );
  const crossContaminations = Number(crossRes.rows[0].total);

  const isConsistent =
    negativeBalances === 0 &&
    discrepancies === 0 &&
    crossContaminations === 0;

  return {
    totalWalletsAudited: totalWallets,
    negativeBalancesFound: negativeBalances,
    ledgerDiscrepanciesFound: discrepancies,
    crossContaminations,
    isConsistent,
  };
}
