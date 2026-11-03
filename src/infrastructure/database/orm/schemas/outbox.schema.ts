import { EntitySchema } from "@mikro-orm/core";

export class OutboxMessageEntity {
  id!: string;
  aggregateId!: string;
  eventType!: string;
  payload!: Record<string, unknown>;
  occurredAt!: Date;
  attempts?: number;
  nextAttemptAt?: Date;
  publishedAt?: Date;
}

export const OutboxSchema = new EntitySchema<OutboxMessageEntity>({
  class: OutboxMessageEntity,
  tableName: "outbox_messages",
  properties: {
    id: { type: "uuid", primary: true },
    aggregateId: { type: "string", length: 128, fieldName: "aggregate_id" },
    eventType: { type: "string", length: 64, fieldName: "event_type" },
    payload: { type: "json" },
    occurredAt: { type: "datetime", fieldName: "occurred_at" },
    attempts: { type: "integer", default: 0 },
    nextAttemptAt: { type: "datetime", nullable: true, fieldName: "next_attempt_at" },
    publishedAt: { type: "datetime", nullable: true, fieldName: "published_at" },
  },
});
