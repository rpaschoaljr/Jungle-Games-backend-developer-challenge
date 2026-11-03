import {
  SendMessageBatchCommand,
} from "@aws-sdk/client-sqs";
import { SqsManager } from "./sqs.client";
import { DatabasePool } from "../database/postgres.pool";
import { PostgresOutboxRepository } from "../database/repositories/postgres-outbox.repository";

export class OutboxPublisher {
  static async publishBatch(batchSize = 100): Promise<number> {
    const pool = DatabasePool.getPool();
    const client = await pool.connect();

    try {
      const outboxRepo = new PostgresOutboxRepository(client);
      const pending = await outboxRepo.fetchPending(batchSize);
      if (pending.length === 0) return 0;

      const queueUrl = await SqsManager.ensureQueues();
      const sqs = SqsManager.getClient();
      let published = 0;

      // Envia em sub-lotes de 10 mensagens (limite do SQS SendMessageBatch)
      for (let i = 0; i < pending.length; i += 10) {
        const chunk = pending.slice(i, i + 10);
        try {
          await sqs.send(
            new SendMessageBatchCommand({
              QueueUrl: queueUrl,
              Entries: chunk.map((entry) => ({
                Id: entry.id,
                MessageBody: JSON.stringify(entry),
                MessageGroupId: entry.aggregateId,
                MessageDeduplicationId: entry.id,
              })),
            })
          );
          for (const entry of chunk) {
            await outboxRepo.markPublished(entry.id);
            published++;
          }
        } catch {
          break;
        }
      }
      return published;
    } catch {
      return 0;
    } finally {
      client.release();
    }
  }

  static async flushSample(maxMessages = 1000): Promise<number> {
    let total = 0;
    while (total < maxMessages) {
      const count = await OutboxPublisher.publishBatch(100);
      if (count === 0) break;
      total += count;
    }
    return total;
  }
}
