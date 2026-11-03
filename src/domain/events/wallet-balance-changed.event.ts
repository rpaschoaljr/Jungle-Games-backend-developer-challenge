import { IntegrationEvent, IntegrationEventProps } from "./integration-event.base";

export interface WalletBalanceChangedData {
  walletId: string;
  transactionId: string;
  direction: string;
  money: { amount: string; currency: string };
  balanceBefore: { amount: string; currency: string };
  balanceAfter: { amount: string; currency: string };
  walletVersion: number;
}

export class WalletBalanceChanged extends IntegrationEvent<WalletBalanceChangedData> {
  readonly eventType = "WalletBalanceChanged";
  readonly version = 1;

  static create(props: IntegrationEventProps<WalletBalanceChangedData>) {
    return new WalletBalanceChanged(props);
  }
}
