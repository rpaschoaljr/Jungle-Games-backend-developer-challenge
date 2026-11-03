import { EntitySchema } from "@mikro-orm/core";

export class InboxMessageEntity {
  messageId!: string;
  consumerName!: string;
  payloadHash!: string;
  receivedAt!: Date;
  processedAt?: Date;
}

export const InboxSchema = new EntitySchema<InboxMessageEntity>({
  class: InboxMessageEntity,
  tableName: "inbox_messages",
  properties: {
    messageId: { type: "string", length: 128, primary: true, fieldName: "message_id" },
    consumerName: { type: "string", length: 64, primary: true, fieldName: "consumer_name" },
    payloadHash: { type: "string", length: 64, fieldName: "payload_hash" },
    receivedAt: { type: "datetime", fieldName: "received_at" },
    processedAt: { type: "datetime", nullable: true, fieldName: "processed_at" },
  },
});
