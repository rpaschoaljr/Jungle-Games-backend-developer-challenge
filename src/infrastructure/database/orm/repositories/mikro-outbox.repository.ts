import { EntityManager } from "@mikro-orm/core";
import {
  IOutboxRepository,
  OutboxEntry,
} from "@application/ports/outbox.repository.interface";
import { OutboxMessageEntity } from "../schemas/outbox.schema";

export class MikroOrmOutboxRepository implements IOutboxRepository {
  constructor(private readonly em: EntityManager) {}

  async append(entry: OutboxEntry): Promise<void> {
    const entity = this.em.create(OutboxMessageEntity, {
      id: entry.id,
      aggregateId: entry.aggregateId,
      eventType: entry.eventType,
      payload: entry.payload,
      occurredAt: entry.occurredAt,
      attempts: 0,
    });
    this.em.persist(entity);
    await this.em.flush();
  }

  async fetchPending(limit = 100): Promise<OutboxEntry[]> {
    const list = await this.em.find(
      OutboxMessageEntity,
      { publishedAt: null },
      { orderBy: { occurredAt: "ASC" }, limit }
    );
    return list.map((e) => ({
      id: e.id,
      aggregateId: e.aggregateId,
      eventType: e.eventType,
      payload: e.payload,
      occurredAt: e.occurredAt,
      attempts: e.attempts,
    }));
  }

  async markPublished(id: string): Promise<void> {
    const entity = await this.em.findOne(OutboxMessageEntity, { id });
    if (entity) {
      entity.publishedAt = new Date();
      await this.em.flush();
    }
  }

  async countPending(): Promise<number> {
    return await this.em.count(OutboxMessageEntity, { publishedAt: null });
  }
}
