import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { SqsManager } from "./sqs.client";
import { ProcessWagerTransactionUseCase } from "@application/use-cases/process-wager/process-wager.use-case";
import { DatabasePool } from "../database/postgres.pool";

export class SqsConsumerWorker {
  private isRunning = false;
  private readonly consumerName = "wager-sqs-consumer";

  constructor(private readonly useCase: ProcessWagerTransactionUseCase) {}

  async processSingleMessage(queueUrl: string): Promise<boolean> {
    const sqs = SqsManager.getClient();
    const res = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 1,
      })
    );

    if (!res.Messages || res.Messages.length === 0) return false;
    const msg = res.Messages[0];
    const receiptHandle = msg.ReceiptHandle;

    try {
      const parsed = JSON.parse(msg.Body || "{}");
      const messageId = parsed.messageId || msg.MessageId;
      const data = parsed.data || parsed;

      const pool = DatabasePool.getPool();
      const client = await pool.connect();

      try {
        await client.query("BEGIN");
        const existingInbox = await client.query(
          "SELECT 1 FROM inbox_messages WHERE consumer_name = $1 AND message_id = $2",
          [this.consumerName, messageId]
        );

        if (existingInbox.rows.length === 0) {
          await client.query(
            "INSERT INTO inbox_messages (message_id, consumer_name, payload_hash, received_at, processed_at) VALUES ($1, $2, $3, NOW(), NOW())",
            [messageId, this.consumerName, parsed.payloadHash || "direct"]
          );
          await this.useCase.execute(data);
        }

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }

      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: receiptHandle,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  stop(): void {
    this.isRunning = false;
  }
}
