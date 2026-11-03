import { ILedgerRepository } from "@application/ports/ledger.repository.interface";

export interface LedgerItemOutput {
  id: string;
  transactionId: string;
  direction: string;
  money: { amount: string; currency: string };
  balanceBefore: { amount: string; currency: string };
  balanceAfter: { amount: string; currency: string };
  createdAt: string;
}

export class GetWalletLedgerUseCase {
  constructor(private readonly ledgerRepo: ILedgerRepository) {}

  async execute(
    walletId: string,
    limit = 50,
    cursor?: string
  ): Promise<LedgerItemOutput[]> {
    const entries = await this.ledgerRepo.findByWalletId(
      walletId,
      limit,
      cursor
    );
    return entries.map((entry) => ({
      id: entry.id,
      transactionId: entry.transactionId,
      direction: entry.direction,
      money: entry.money.toJSON(),
      balanceBefore: entry.balanceBefore.toJSON(),
      balanceAfter: entry.balanceAfter.toJSON(),
      createdAt: entry.createdAt.toISOString(),
    }));
  }
}
