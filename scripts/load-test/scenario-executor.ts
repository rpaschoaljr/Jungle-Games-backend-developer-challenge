import { ProcessWagerTransactionUseCase } from "../../src/application/use-cases/process-wager/process-wager.use-case";
import { isInfraError, StormStats } from "./infra-error-detector";
import {
  runSingleBet,
  runReplay,
  runConflict,
  runInvalid,
  runInsufficient,
} from "./scenario-runners";

export async function executeWorkerScenario(
  i: number,
  wId: string,
  pId: string,
  uc: ProcessWagerTransactionUseCase,
  s: StormStats
): Promise<void> {
  const mode = i % 10;
  let done = false;

  while (!done) {
    try {
      if (mode < 6) await runSingleBet(i, wId, pId, uc, s);
      else if (mode === 6) await runReplay(i, wId, pId, uc, s);
      else if (mode === 7) await runConflict(i, wId, pId, uc, s);
      else if (mode === 8) await runInvalid(i, wId, pId, uc, s);
      else await runInsufficient(i, wId, pId, uc, s);
      done = true;
    } catch (err: any) {
      if (isInfraError(err)) {
        s.downtimeCollisions++;
        // Zero sleep! Cede o microtick do runtime imediatamente sem delay
        await new Promise((res) => setImmediate(res));
      } else {
        throw err;
      }
    }
  }
}
