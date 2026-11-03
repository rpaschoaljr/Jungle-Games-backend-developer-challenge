import { spawn } from "child_process";
import { runMigrations } from "../src/infrastructure/database/migration-runner";
import { runDevSeeds } from "../src/infrastructure/database/seeds/seed-wallets";

function runCmd(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit" });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function waitForPostgres(retries = 20): Promise<void> {
  const { DatabasePool } = await import(
    "../src/infrastructure/database/postgres.pool"
  );
  for (let i = 0; i < retries; i++) {
    try {
      const pool = DatabasePool.getPool();
      await pool.query("SELECT 1");
      console.log("PostgreSQL is ready!");
      return;
    } catch {
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
  throw new Error("Timeout waiting for PostgreSQL");
}

async function start() {
  console.log("Starting containers via docker compose...");
  await runCmd("docker", ["compose", "up", "-d", "postgres", "sqs"]);

  console.log("Waiting for PostgreSQL 19rc1...");
  await waitForPostgres();

  console.log("Running migrations...");
  await runMigrations();

  console.log("Running dev seeds...");
  await runDevSeeds();

  console.log("Starting NestJS development server...");
  const app = spawn("bun", ["--watch", "src/main.ts"], { stdio: "inherit" });

  const cleanup = async () => {
    console.log("\nShutting down dev environment...");
    app.kill("SIGTERM");
    try {
      await runCmd("docker", ["compose", "down"]);
      console.log("Containers stopped cleanly.");
    } catch (e) {
      console.error("Error stopping containers:", e);
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

start().catch(console.error);
