import { IntegrationEvent, IntegrationEventProps } from "./integration-event.base";

export interface WagerTransactionPendingReferenceData {
  transactionId: string;
  walletId: string;
  providerId: string;
  referenceExternalTransactionId: string;
  kind: string;
}

export class WagerTransactionPendingReference extends IntegrationEvent<WagerTransactionPendingReferenceData> {
  readonly eventType = "WagerTransactionPendingReference";
  readonly version = 1;

  static create(props: IntegrationEventProps<WagerTransactionPendingReferenceData>) {
    return new WagerTransactionPendingReference(props);
  }
}
