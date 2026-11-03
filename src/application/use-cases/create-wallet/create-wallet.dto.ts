export interface CreateWalletInput {
  playerId: string;
  initialBalance: {
    amount: string;
    currency: string;
  };
}

export interface CreateWalletOutput {
  id: string;
  playerId: string;
  balance: {
    amount: string;
    currency: string;
  };
  version: number;
}
