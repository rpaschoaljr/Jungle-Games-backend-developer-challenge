import { Money } from "../../money/money.vo";
import { Wallet } from "../wallet.entity";
import {
  WalletLedgerEntry,
  LedgerDirection,
} from "../ledger-entry.entity";

export interface ApplyCreditParams {
  wallet: Wallet;
  money: Money;
  transactionId: string;
  entryId: string;
  now?: Date;
}

export interface ApplyCreditResult {
  wallet: Wallet;
  ledgerEntry: WalletLedgerEntry;
}

export function applyCredit(params: ApplyCreditParams): ApplyCreditResult {
  const now = params.now ?? new Date();
  const balanceBefore = params.wallet.balance;

  params.wallet.mutateCredit(params.money, now);
  const balanceAfter = params.wallet.balance;

  const ledgerEntry = WalletLedgerEntry.create({
    id: params.entryId,
    walletId: params.wallet.id,
    transactionId: params.transactionId,
    direction: LedgerDirection.Credit,
    money: params.money,
    balanceBefore,
    balanceAfter,
    createdAt: now,
  });

  return { wallet: params.wallet, ledgerEntry };
}
