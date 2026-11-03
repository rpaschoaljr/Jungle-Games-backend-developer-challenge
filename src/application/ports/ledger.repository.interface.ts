import { WalletLedgerEntry } from "@domain/wallet/ledger-entry.entity";

export interface ILedgerRepository {
  append(entry: WalletLedgerEntry): Promise<void>;
  findByWalletId(
    walletId: string,
    limit: number,
    cursor?: string
  ): Promise<WalletLedgerEntry[]>;
  sumBalance(walletId: string): Promise<bigint>;
  countByWalletId(walletId: string): Promise<number>;
}
