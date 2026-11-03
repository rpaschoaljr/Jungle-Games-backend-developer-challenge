import { Wallet } from "@domain/wallet/wallet.entity";

export interface IWalletRepository {
  findById(id: string): Promise<Wallet | null>;
  findForUpdate(id: string): Promise<Wallet | null>;
  create(wallet: Wallet): Promise<void>;
  updateBalance(wallet: Wallet): Promise<void>;
  findAll(): Promise<Wallet[]>;
}
