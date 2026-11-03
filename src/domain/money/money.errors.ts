export class InvalidMoneyError extends Error {
  constructor(message: string) {
    super(`[InvalidMoneyError] ${message}`);
    this.name = "InvalidMoneyError";
  }
}

export class CurrencyMismatchError extends Error {
  constructor(c1: string, c2: string) {
    super(`[CurrencyMismatchError] Cannot operate between ${c1} and ${c2}`);
    this.name = "CurrencyMismatchError";
  }
}
