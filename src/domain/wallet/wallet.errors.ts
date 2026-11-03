export class InsufficientFundsError extends Error {
  constructor(walletId: string) {
    super(`[InsufficientFundsError] Wallet ${walletId} has insufficient funds`);
    this.name = "InsufficientFundsError";
  }
}

export class InvalidLedgerArithmeticError extends Error {
  constructor(msg: string) {
    super(`[InvalidLedgerArithmeticError] ${msg}`);
    this.name = "InvalidLedgerArithmeticError";
  }
}

export class WalletCurrencyMismatchError extends Error {
  constructor(walletCurrency: string, operationCurrency: string) {
    super(
      `[WalletCurrencyMismatchError] Wallet currency ${walletCurrency} ` +
      `does not match operation currency ${operationCurrency}`
    );
    this.name = "WalletCurrencyMismatchError";
  }
}
