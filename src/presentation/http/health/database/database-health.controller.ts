import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { DatabasePool } from "@infrastructure/database/postgres.pool";
import { SqsManager } from "@infrastructure/messaging/sqs.client";

@Controller("health")
export class DatabaseHealthController {
  @Get("ready")
  async handle() {
    let dbStatus = "down";
    let sqsStatus = "down";

    try {
      const pool = DatabasePool.getPool();
      await pool.query("SELECT 1");
      dbStatus = "connected";
    } catch {}

    const isSqsOk = await SqsManager.isHealthy();
    if (isSqsOk) sqsStatus = "connected";

    if (dbStatus === "connected" && sqsStatus === "connected") {
      return { status: "ready", database: dbStatus, sqs: sqsStatus };
    }

    throw new HttpException(
      { status: "not_ready", database: dbStatus, sqs: sqsStatus },
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }
}
