export function isInfraError(err: any): boolean {
  const msg = (err?.message || "").toLowerCase();
  const code = err?.code || "";
  return (
    code === "57P01" ||
    code === "57P02" ||
    code === "57P03" ||
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "EPIPE" ||
    msg.includes("connection") ||
    msg.includes("socket") ||
    msg.includes("queryable") ||
    msg.includes("closed") ||
    msg.includes("terminating") ||
    msg.includes("timeout") ||
    msg.includes("refused") ||
    msg.includes("broken pipe")
  );
}

export interface StormStats {
  successfulBets: number;
  idempotentReplays: number;
  idempotencyConflicts: number;
  invalidPayloadRejections: number;
  insufficientFundsRejections: number;
  downtimeCollisions: number;
}
