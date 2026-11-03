import { DatabasePool } from "../../src/infrastructure/database/postgres.pool";
import { PostgresUnitOfWork } from "../../src/infrastructure/database/postgres-unit-of-work";
import { ProcessWagerTransactionUseCase } from "../../src/application/use-cases/process-wager/process-wager.use-case";
import { SqsManager } from "../../src/infrastructure/messaging/sqs.client";
import { OutboxPublisher } from "../../src/infrastructure/messaging/outbox-publisher";
import { seedWalletsBatch } from "./seed-batch";
import {
  simulatePostgresCrash,
  simulateSqsCrash,
  simulateBothCrash,
} from "./crash-simulator";
import { executeWorkerScenario } from "./scenario-executor";
import { StormStats } from "./infra-error-detector";
import { verifyAudit } from "./audit-verifier";
import { printLoadTestReport } from "./report-formatter";

process.on("unhandledRejection", () => {});
const TOTAL_WORKERS = 65536;

async function run() {
  const pool = DatabasePool.getPool();
  const uow = new PostgresUnitOfWork();
  const useCase = new ProcessWagerTransactionUseCase(uow);

  await SqsManager.ensureQueues();
  const items = await seedWalletsBatch(pool, TOTAL_WORKERS);
  console.log(`🚀 Disparando ${TOTAL_WORKERS.toLocaleString()} trabalhadores simultâneos (ZERO SLEEP)...`);

  const stats: StormStats = {
    successfulBets: 0,
    idempotentReplays: 0,
    idempotencyConflicts: 0,
    invalidPayloadRejections: 0,
    insufficientFundsRejections: 0,
    downtimeCollisions: 0,
  };

  const startTime = Date.now();
  let completed = 0;
  let c1P: Promise<number> = Promise.resolve(0);
  let c2P: Promise<number> = Promise.resolve(0);
  let c3P: Promise<number> = Promise.resolve(0);
  let c1Trig = false;
  let c2Trig = false;
  let c3Trig = false;

  async function worker(i: number, item: { walletId: string; playerId: string }) {
    await executeWorkerScenario(i, item.walletId, item.playerId, useCase, stats);
    completed++;

    if (completed >= 16384 && !c1Trig) {
      c1Trig = true;
      c1P = simulatePostgresCrash();
    } else if (completed >= 32768 && !c2Trig) {
      c2Trig = true;
      c2P = simulateSqsCrash();
    } else if (completed >= 49152 && !c3Trig) {
      c3Trig = true;
      c3P = simulateBothCrash();
    }

    if (completed % 5000 === 0 || completed === 100 || completed === 1000) {
      const pct = ((completed / TOTAL_WORKERS) * 100).toFixed(1);
      console.log(`📍 [PROGRESSO] ${completed.toLocaleString()} finalizados (${pct}%) | Colisões: ${stats.downtimeCollisions}`);
    }
  }

  await Promise.all(items.map((item, i) => worker(i, item)));
  const totalSeconds = (Date.now() - startTime) / 1000;

  const [d1, d2, d3] = await Promise.all([c1P, c2P, c3P]);
  console.log("📤 [OUTBOX] Descarregando lote de eventos pendentes para a fila SQS...");
  await OutboxPublisher.flushSample(1000);

  const audit = await verifyAudit();
  printLoadTestReport({
    totalWorkers: TOTAL_WORKERS,
    totalTimeSeconds: totalSeconds,
    rps: TOTAL_WORKERS / totalSeconds,
    successfulBets: stats.successfulBets,
    idempotentReplays: stats.idempotentReplays,
    idempotencyConflicts: stats.idempotencyConflicts,
    invalidPayloadRejections: stats.invalidPayloadRejections,
    insufficientFundsRejections: stats.insufficientFundsRejections,
    downtimeCollisions: stats.downtimeCollisions,
    postgresDowntimeMs: d1,
    sqsDowntimeMs: d2,
    bothDowntimeMs: d3,
    audit,
  });
}

run().catch(console.error);
