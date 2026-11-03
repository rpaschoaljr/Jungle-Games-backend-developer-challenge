import { AuditResult } from "./audit-verifier";

export interface LoadMetrics {
  totalWorkers: number;
  totalTimeSeconds: number;
  rps: number;
  successfulBets: number;
  idempotentReplays: number;
  idempotencyConflicts: number;
  invalidPayloadRejections: number;
  insufficientFundsRejections: number;
  downtimeCollisions: number;
  postgresDowntimeMs: number;
  sqsDowntimeMs: number;
  bothDowntimeMs: number;
  audit: AuditResult;
}

export function printLoadTestReport(m: LoadMetrics): void {
  console.log("\n========================================================");
  console.log("📊 RELATÓRIO DO TESTE DE TEMPESTADE E RESILIÊNCIA (2^16)");
  console.log("========================================================");

  console.table([
    { Métrica: "Total de Trabalhadores (2^16)", Valor: m.totalWorkers.toLocaleString() },
    { Métrica: "Tempo Total de Execução", Valor: `${m.totalTimeSeconds.toFixed(2)} segundos` },
    { Métrica: "Throughput Médio", Valor: `${m.rps.toFixed(2)} ops/segundo (RPS)` },
    { Métrica: "Apostas Confirmadas (PROCESSED)", Valor: m.successfulBets.toLocaleString() },
    { Métrica: "Replays de Idempotência Confirmados", Valor: m.idempotentReplays.toLocaleString() },
    { Métrica: "Conflitos de Idempotência Rejeitados", Valor: m.idempotencyConflicts.toLocaleString() },
    { Métrica: "Payloads Inválidos Rejeitados (Domínio)", Valor: m.invalidPayloadRejections.toLocaleString() },
    { Métrica: "Saldo Insuficiente Rejeitados", Valor: m.insufficientFundsRejections.toLocaleString() },
    { Métrica: "Colisões Durante Downtime (Sem Sleep)", Valor: m.downtimeCollisions.toLocaleString() },
    { Métrica: "Downtime Crash 1: PostgreSQL 19", Valor: `${m.postgresDowntimeMs} ms` },
    { Métrica: "Downtime Crash 2: AWS SQS", Valor: `${m.sqsDowntimeMs} ms` },
    { Métrica: "Downtime Crash 3: PostgreSQL + SQS", Valor: `${m.bothDowntimeMs} ms` },
    { Métrica: "Saldos Negativos no PostgreSQL", Valor: m.audit.negativeBalancesFound },
    { Métrica: "Divergências no Ledger Imutável", Valor: m.audit.ledgerDiscrepanciesFound },
    { Métrica: "Cruzamento de Dados entre Carteiras", Valor: m.audit.crossContaminations },
    {
      Métrica: "Integridade Final do Banco",
      Valor: m.audit.isConsistent ? "✅ 100% ÍNTEGRO (Zero perdas)" : "❌ INCONSISTENTE",
    },
  ]);

  console.log("========================================================\n");
}
