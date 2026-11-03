import { Money } from "@domain/money/money.vo";
import { IWalletRepository } from "@application/ports/wallet.repository.interface";
import { ILedgerRepository } from "@application/ports/ledger.repository.interface";

export interface ReconcileWalletOutput {
  walletId: string;
  storedBalance: { amount: string; currency: string };
  calculatedBalance: { amount: string; currency: string };
  difference: { amount: string; currency: string };
  consistent: boolean;
  checkedEntries: number;
}

export class ReconcileWalletUseCase {
  constructor(
    private readonly walletRepo: IWalletRepository,
    private readonly ledgerRepo: ILedgerRepository
  ) {}

  async execute(walletId: string): Promise<ReconcileWalletOutput> {
    const wallet = await this.walletRepo.findById(walletId);
    if (!wallet) {
      throw new Error(`Wallet ${walletId} not found`);
    }

    const calculatedCents = await this.ledgerRepo.sumBalance(walletId);
    const calculatedMoney = Money.fromCents(calculatedCents, wallet.currency);
    const count = await this.ledgerRepo.countByWalletId(walletId);

    const diffMoney = wallet.balance.subtract(calculatedMoney);
    const consistent = diffMoney.isZero();

    return {
      walletId,
      storedBalance: wallet.balance.toJSON(),
      calculatedBalance: calculatedMoney.toJSON(),
      difference: diffMoney.toJSON(),
      consistent,
      checkedEntries: count,
    };
  }
}
