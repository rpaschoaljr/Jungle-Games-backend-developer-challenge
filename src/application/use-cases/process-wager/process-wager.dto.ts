export interface ProcessWagerInput {
  idempotencyKey: string;
  providerId: string;
  externalTransactionId: string;
  playerId: string;
  walletId: string;
  roundId: string;
  gameId: string;
  kind: "BET" | "WIN" | "LOSS" | "REFUND" | "ROLLBACK";
  money: {
    amount: string;
    currency: string;
  };
  referenceExternalTransactionId?: string;
}

export interface ProcessWagerOutput {
  transactionId: string;
  status: "PROCESSED" | "REJECTED" | "PENDING_REFERENCE";
  failureCode?: string;
  balance: {
    amount: string;
    currency: string;
  };
  idempotentReplay: boolean;
}
