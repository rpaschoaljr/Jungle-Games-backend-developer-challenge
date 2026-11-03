import { Money } from "../money/money.vo";
import {
  InvalidTransactionStateError,
  MissingReferenceTransactionError,
} from "./payment-state.errors";
import {
  CreateWagerTransactionProps,
  WagerTransactionKind,
  WagerTransactionStatus,
} from "./wager-transaction.types";

export * from "./wager-transaction.types";

export class WagerTransaction {
  private constructor(
    public readonly id: string,
    public readonly providerId: string,
    public readonly externalTransactionId: string,
    public readonly idempotencyKey: string,
    public readonly payloadHash: string,
    public readonly walletId: string,
    public readonly playerId: string,
    public readonly roundId: string,
    public readonly gameId: string,
    public readonly kind: WagerTransactionKind,
    public readonly money: Money,
    public readonly referenceExternalTransactionId: string | undefined,
    public readonly createdAt: Date,
    private _status: WagerTransactionStatus,
    private _referenceTransactionId?: string,
    private _failureCode?: string,
    private _processedAt?: Date
  ) {}

  static create(props: CreateWagerTransactionProps): WagerTransaction {
    const isRefRequired =
      props.kind === WagerTransactionKind.Refund ||
      props.kind === WagerTransactionKind.Rollback;
    if (isRefRequired && !props.referenceExternalTransactionId) {
      throw new MissingReferenceTransactionError(props.kind);
    }
    return new WagerTransaction(
      props.id,
      props.providerId,
      props.externalTransactionId,
      props.idempotencyKey,
      props.payloadHash,
      props.walletId,
      props.playerId,
      props.roundId,
      props.gameId,
      props.kind,
      props.money,
      props.referenceExternalTransactionId,
      props.createdAt,
      WagerTransactionStatus.Pending
    );
  }

  get status(): WagerTransactionStatus { return this._status; }
  get currency(): string { return this.money.currency; }
  get failureCode(): string | undefined { return this._failureCode; }
  get processedAt(): Date | undefined { return this._processedAt; }
  get referenceTransactionId(): string | undefined {
    return this._referenceTransactionId;
  }

  markProcessed(referenceTxId: string | undefined, at: Date): void {
    this.assertNotTerminal();
    this._status = WagerTransactionStatus.Processed;
    this._referenceTransactionId = referenceTxId;
    this._processedAt = at;
  }

  markPendingReference(): void {
    this.assertNotTerminal();
    this._status = WagerTransactionStatus.PendingReference;
  }

  reject(code: string): void {
    this.assertNotTerminal();
    this._status = WagerTransactionStatus.Rejected;
    this._failureCode = code;
  }

  fail(code: string): void {
    this.assertNotTerminal();
    this._status = WagerTransactionStatus.Failed;
    this._failureCode = code;
  }

  isTerminal(): boolean {
    return (
      this._status === WagerTransactionStatus.Processed ||
      this._status === WagerTransactionStatus.Rejected ||
      this._status === WagerTransactionStatus.Failed
    );
  }

  affectsBalance(): boolean {
    return this.kind !== WagerTransactionKind.Loss;
  }

  private assertNotTerminal(): void {
    if (this.isTerminal()) {
      throw new InvalidTransactionStateError(this._status);
    }
  }
}
