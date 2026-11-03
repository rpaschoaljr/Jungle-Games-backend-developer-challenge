import { Money } from "../../money/money.vo";
import { Wallet } from "../wallet.entity";
import {
  WalletLedgerEntry,
  LedgerDirection,
} from "../ledger-entry.entity";

export interface ApplyDebitParams {
  wallet: Wallet;
  money: Money;
  transactionId: string;
  entryId: string;
  now?: Date;
}

export interface ApplyDebitResult {
  wallet: Wallet;
  ledgerEntry: WalletLedgerEntry;
}

export function applyDebit(params: ApplyDebitParams): ApplyDebitResult {
  const now = params.now ?? new Date();
  const balanceBefore = params.wallet.balance;

  params.wallet.mutateDebit(params.money, now);
  const balanceAfter = params.wallet.balance;

  const ledgerEntry = WalletLedgerEntry.create({
    id: params.entryId,
    walletId: params.wallet.id,
    transactionId: params.transactionId,
    direction: LedgerDirection.Debit,
    money: params.money,
    balanceBefore,
    balanceAfter,
    createdAt: now,
  });

  return { wallet: params.wallet, ledgerEntry };
}
