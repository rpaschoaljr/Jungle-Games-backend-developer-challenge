import { IntegrationEvent, IntegrationEventProps } from "./integration-event.base";

export interface WagerTransactionProcessedData {
  transactionId: string;
  walletId: string;
  playerId: string;
  roundId: string;
  gameId: string;
  kind: string;
  money: { amount: string; currency: string };
  balance: { amount: string; currency: string };
  referenceTransactionId?: string;
}

export class WagerTransactionProcessed extends IntegrationEvent<WagerTransactionProcessedData> {
  readonly eventType = "WagerTransactionProcessed";
  readonly version = 1;

  static create(props: IntegrationEventProps<WagerTransactionProcessedData>) {
    return new WagerTransactionProcessed(props);
  }
}
