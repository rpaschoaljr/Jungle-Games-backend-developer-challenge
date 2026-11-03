import { PoolClient } from "pg";
import {
  IOutboxRepository,
  OutboxEntry,
} from "@application/ports/outbox.repository.interface";

export class PostgresOutboxRepository implements IOutboxRepository {
  constructor(private readonly client: PoolClient) {}

  async append(entry: OutboxEntry): Promise<void> {
    const query = `
      INSERT INTO outbox_messages (
        id, aggregate_id, event_type, payload, occurred_at
      ) VALUES ($1, $2, $3, $4, $5)
    `;
    await this.client.query(query, [
      entry.id,
      entry.aggregateId,
      entry.eventType,
      JSON.stringify(entry.payload),
      entry.occurredAt,
    ]);
  }

  async fetchPending(limit = 100): Promise<OutboxEntry[]> {
    const query = `
      SELECT id, aggregate_id, event_type, payload, occurred_at, attempts
      FROM outbox_messages
      WHERE published_at IS NULL
      ORDER BY occurred_at ASC
      LIMIT $1
      FOR UPDATE SKIP LOCKED
    `;
    const res = await this.client.query(query, [limit]);
    return res.rows.map((r) => ({
      id: r.id,
      aggregateId: r.aggregate_id,
      eventType: r.event_type,
      payload: r.payload,
      occurredAt: r.occurred_at,
      attempts: r.attempts,
    }));
  }

  async markPublished(id: string): Promise<void> {
    await this.client.query(
      "UPDATE outbox_messages SET published_at = NOW() WHERE id = $1",
      [id]
    );
  }

  async countPending(): Promise<number> {
    const res = await this.client.query(
      "SELECT COUNT(*) AS total FROM outbox_messages WHERE published_at IS NULL"
    );
    return Number(res.rows[0].total);
  }
}
