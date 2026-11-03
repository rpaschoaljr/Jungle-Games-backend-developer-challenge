export class InvalidTransactionStateError extends Error {
  constructor(status: string) {
    super(
      `[InvalidTransactionStateError] Transaction is in terminal state: ${status}`
    );
    this.name = "InvalidTransactionStateError";
  }
}

export class MissingReferenceTransactionError extends Error {
  constructor(kind: string) {
    super(
      `[MissingReferenceTransactionError] Kind ${kind} requires a reference`
    );
    this.name = "MissingReferenceTransactionError";
  }
}
