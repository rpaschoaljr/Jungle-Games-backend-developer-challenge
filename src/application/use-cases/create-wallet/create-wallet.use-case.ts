import { v4 as uuidv4 } from "uuid";
import { Money } from "@domain/money/money.vo";
import { Wallet } from "@domain/wallet/wallet.entity";
import {
  WalletLedgerEntry,
  LedgerDirection,
} from "@domain/wallet/ledger-entry.entity";
import { IUnitOfWork } from "@application/ports/unit-of-work.interface";
import {
  CreateWalletInput,
  CreateWalletOutput,
} from "./create-wallet.dto";

export class CreateWalletUseCase {
  constructor(private readonly uow: IUnitOfWork) {}

  async execute(input: CreateWalletInput): Promise<CreateWalletOutput> {
    const initialMoney = Money.from(input.initialBalance);
    const walletId = uuidv4();
    const now = new Date();

    const wallet = Wallet.open({
      id: walletId,
      playerId: input.playerId,
      initialBalance: initialMoney,
      now,
    });

    return await this.uow.runInTransaction(async (ctx) => {
      await ctx.walletRepo.create(wallet);

      if (initialMoney.isPositive()) {
        const openingEntry = WalletLedgerEntry.create({
          id: uuidv4(),
          walletId,
          transactionId: "INTERNAL_OPENING",
          direction: LedgerDirection.Credit,
          money: initialMoney,
          balanceBefore: Money.zero(initialMoney.currency),
          balanceAfter: initialMoney,
          createdAt: now,
        });
        await ctx.ledgerRepo.append(openingEntry);
      }

      return {
        id: wallet.id,
        playerId: wallet.playerId,
        balance: wallet.balance.toJSON(),
        version: wallet.version,
      };
    });
  }
}
