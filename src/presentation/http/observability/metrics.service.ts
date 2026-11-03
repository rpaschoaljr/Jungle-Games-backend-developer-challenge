import { Injectable } from "@nestjs/common";
import { DatabasePool } from "@infrastructure/database/postgres.pool";

@Injectable()
export class MetricsService {
  private static duplicateReplaysCount = 0;
  private static conflictsCount = 0;

  static recordDuplicateReplay() {
    MetricsService.duplicateReplaysCount++;
  }

  static recordConflict() {
    MetricsService.conflictsCount++;
  }

  async getMetrics() {
    const pool = DatabasePool.getPool();
    const statusRes = await pool.query(
      "SELECT status, COUNT(*) AS total FROM wager_transactions GROUP BY status"
    );
    const txByStatus: Record<string, number> = {};
    for (const r of statusRes.rows) {
      txByStatus[r.status] = Number(r.total);
    }

    const outboxRes = await pool.query(
      "SELECT COUNT(*) AS total FROM outbox_messages WHERE published_at IS NULL"
    );
    const outboxLag = Number(outboxRes.rows[0]?.total || 0);

    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      transactionsByStatus: txByStatus,
      idempotency: {
        duplicateReplaysDetected: MetricsService.duplicateReplaysCount,
        conflictsDetected: MetricsService.conflictsCount,
      },
      outboxLag,
      systemMemoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };
  }
}
