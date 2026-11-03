import { IntegrationEvent, IntegrationEventProps } from "./integration-event.base";

export interface WagerTransactionRejectedData {
  transactionId: string;
  walletId: string;
  playerId: string;
  roundId: string;
  gameId: string;
  kind: string;
  money: { amount: string; currency: string };
  failureCode: string;
}

export class WagerTransactionRejected extends IntegrationEvent<WagerTransactionRejectedData> {
  readonly eventType = "WagerTransactionRejected";
  readonly version = 1;

  static create(props: IntegrationEventProps<WagerTransactionRejectedData>) {
    return new WagerTransactionRejected(props);
  }
}
