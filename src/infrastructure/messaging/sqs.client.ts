import {
  SQSClient,
  CreateQueueCommand,
  GetQueueUrlCommand,
  ListQueuesCommand,
} from "@aws-sdk/client-sqs";

export class SqsManager {
  private static client: SQSClient | null = null;
  public static readonly QUEUE_NAME = "wager-transactions.fifo";
  public static readonly DLQ_NAME = "wager-transactions-dlq.fifo";

  static getClient(): SQSClient {
    if (!SqsManager.client) {
      SqsManager.client = new SQSClient({
        endpoint: process.env.SQS_ENDPOINT || "http://localhost:4566",
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
        },
      });
    }
    return SqsManager.client;
  }

  static async ensureQueueByName(name: string): Promise<string> {
    const client = SqsManager.getClient();
    try {
      const getRes = await client.send(new GetQueueUrlCommand({ QueueName: name }));
      if (getRes.QueueUrl) return getRes.QueueUrl;
    } catch {}

    const createRes = await client.send(
      new CreateQueueCommand({
        QueueName: name,
        Attributes: {
          FifoQueue: "true",
          ContentBasedDeduplication: "true",
        },
      })
    );
    return createRes.QueueUrl || "";
  }

  static async ensureQueues(): Promise<string> {
    await SqsManager.ensureQueueByName(SqsManager.DLQ_NAME);
    return await SqsManager.ensureQueueByName(SqsManager.QUEUE_NAME);
  }

  static async isHealthy(): Promise<boolean> {
    try {
      const client = SqsManager.getClient();
      await client.send(new ListQueuesCommand({ MaxResults: 1 }));
      return true;
    } catch {
      return false;
    }
  }
}
