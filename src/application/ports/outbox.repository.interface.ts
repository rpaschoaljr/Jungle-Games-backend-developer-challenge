export interface OutboxEntry {
  id: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  attempts?: number;
  publishedAt?: Date;
}

export interface IOutboxRepository {
  append(entry: OutboxEntry): Promise<void>;
  fetchPending(limit: number): Promise<OutboxEntry[]>;
  markPublished(id: string): Promise<void>;
  countPending(): Promise<number>;
}
