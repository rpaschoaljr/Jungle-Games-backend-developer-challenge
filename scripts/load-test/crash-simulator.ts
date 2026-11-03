import { spawn } from "child_process";
import { DatabasePool } from "../../src/infrastructure/database/postgres.pool";
import { SqsManager } from "../../src/infrastructure/messaging/sqs.client";

function restartContainer(containerName: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn("docker", ["restart", containerName], {
      stdio: "ignore",
    });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Failed to restart ${containerName} (code ${code})`));
    });
  });
}

async function waitForPostgres(): Promise<void> {
  const pool = DatabasePool.getPool();
  while (true) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch {
      await new Promise((res) => setTimeout(res, 200));
    }
  }
}

async function waitForSqs(): Promise<void> {
  while (true) {
    try {
      const ok = await SqsManager.isHealthy();
      if (ok) return;
    } catch {}
    await new Promise((res) => setTimeout(res, 200));
  }
}

export async function simulatePostgresCrash(): Promise<number> {
  console.log("\n💥 [CRASH 1] Derrubando o PostgreSQL 19 em background...");
  const t0 = Date.now();
  await restartContainer("jungle_postgres");
  await waitForPostgres();
  const downtime = Date.now() - t0;
  console.log(`✅ [RECUPERADO 1] PostgreSQL restabelecido em ${downtime}ms!\n`);
  return downtime;
}

export async function simulateSqsCrash(): Promise<number> {
  console.log("\n💥 [CRASH 2] Derrubando o AWS SQS em background...");
  const t0 = Date.now();
  await restartContainer("jungle_sqs");
  await waitForSqs();
  const downtime = Date.now() - t0;
  console.log(`✅ [RECUPERADO 2] AWS SQS restabelecido em ${downtime}ms!\n`);
  return downtime;
}

export async function simulateBothCrash(): Promise<number> {
  console.log("\n💥 [CRASH 3] Derrubando PostgreSQL + SQS simultaneamente...");
  const t0 = Date.now();
  await Promise.all([
    restartContainer("jungle_postgres"),
    restartContainer("jungle_sqs"),
  ]);
  await Promise.all([waitForPostgres(), waitForSqs()]);
  const downtime = Date.now() - t0;
  console.log(`✅ [RECUPERADO 3] Ambos os serviços restabelecidos em ${downtime}ms!\n`);
  return downtime;
}
