import { IWalletRepository } from "@application/ports/wallet.repository.interface";

export interface GetWalletOutput {
  id: string;
  playerId: string;
  currency: string;
  balance: {
    amount: string;
    currency: string;
  };
  version: number;
}

export class GetWalletUseCase {
  constructor(private readonly walletRepo: IWalletRepository) {}

  async execute(walletId: string): Promise<GetWalletOutput | null> {
    const wallet = await this.walletRepo.findById(walletId);
    if (!wallet) return null;

    return {
      id: wallet.id,
      playerId: wallet.playerId,
      currency: wallet.currency,
      balance: wallet.balance.toJSON(),
      version: wallet.version,
    };
  }

  async findAll(): Promise<GetWalletOutput[]> {
    const wallets = await this.walletRepo.findAll();
    return wallets.map((w) => ({
      id: w.id,
      playerId: w.playerId,
      currency: w.currency,
      balance: w.balance.toJSON(),
      version: w.version,
    }));
  }
}
