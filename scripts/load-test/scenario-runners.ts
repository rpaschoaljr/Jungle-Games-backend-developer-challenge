import { ProcessWagerTransactionUseCase } from "../../src/application/use-cases/process-wager/process-wager.use-case";
import { StormStats } from "./infra-error-detector";

export async function runSingleBet(i: number, wId: string, pId: string, uc: ProcessWagerTransactionUseCase, s: StormStats) {
  await uc.execute({
    idempotencyKey: `storm:bet:${wId}`,
    providerId: "prov-storm",
    externalTransactionId: `tx-${wId}`,
    playerId: pId,
    walletId: wId,
    roundId: `round-${i}`,
    gameId: "slots-chimp",
    kind: "BET",
    money: { amount: "25.00", currency: "BRL" },
  });
  s.successfulBets++;
}

export async function runReplay(i: number, wId: string, pId: string, uc: ProcessWagerTransactionUseCase, s: StormStats) {
  const p = {
    idempotencyKey: `storm:replay:${wId}`,
    providerId: "prov-storm",
    externalTransactionId: `tx-${wId}`,
    playerId: pId,
    walletId: wId,
    roundId: `round-${i}`,
    gameId: "slots-chimp",
    kind: "BET" as const,
    money: { amount: "20.00", currency: "BRL" },
  };
  const r1 = await uc.execute(p);
  const r2 = await uc.execute(p);
  if (r1.status === "PROCESSED") s.successfulBets++;
  if (r2.idempotentReplay) s.idempotentReplays++;
}

export async function runConflict(i: number, wId: string, pId: string, uc: ProcessWagerTransactionUseCase, s: StormStats) {
  const key = `storm:conflict:${wId}`;
  await uc.execute({
    idempotencyKey: key,
    providerId: "prov-storm",
    externalTransactionId: `tx-${wId}-orig`,
    playerId: pId,
    walletId: wId,
    roundId: `round-${i}`,
    gameId: "slots-chimp",
    kind: "BET",
    money: { amount: "15.00", currency: "BRL" },
  });
  s.successfulBets++;
  try {
    await uc.execute({
      idempotencyKey: key,
      providerId: "prov-storm",
      externalTransactionId: `tx-${wId}-fake`,
      playerId: pId,
      walletId: wId,
      roundId: `round-${i}`,
      gameId: "slots-chimp",
      kind: "BET",
      money: { amount: "35.00", currency: "BRL" },
    });
  } catch {
    s.idempotencyConflicts++;
  }
}

export async function runInvalid(i: number, wId: string, pId: string, uc: ProcessWagerTransactionUseCase, s: StormStats) {
  try {
    await uc.execute({
      idempotencyKey: `storm:invalid:${wId}`,
      providerId: "prov-storm",
      externalTransactionId: `tx-${wId}`,
      playerId: pId,
      walletId: wId,
      roundId: `round-${i}`,
      gameId: "slots-chimp",
      kind: "BET",
      money: { amount: "99.999", currency: "USD" },
    });
  } catch {
    s.invalidPayloadRejections++;
  }
}

export async function runInsufficient(i: number, wId: string, pId: string, uc: ProcessWagerTransactionUseCase, s: StormStats) {
  const r = await uc.execute({
    idempotencyKey: `storm:insuf:${wId}`,
    providerId: "prov-storm",
    externalTransactionId: `tx-${wId}`,
    playerId: pId,
    walletId: wId,
    roundId: `round-${i}`,
    gameId: "slots-chimp",
    kind: "BET",
    money: { amount: "500.00", currency: "BRL" },
  });
  if (r.status === "REJECTED" && r.failureCode === "INSUFFICIENT_FUNDS") {
    s.insufficientFundsRejections++;
  }
}
