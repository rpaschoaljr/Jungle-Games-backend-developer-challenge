import { ApiBodyOptions, ApiHeaderOptions } from "@nestjs/swagger";

export const WageringHeaderExample: ApiHeaderOptions = {
  name: "Idempotency-Key",
  description:
    "Chave única da transação no provedor.\n" +
    "• Para testar duplicata: mantenha o mesmo valor (ex: prov-a:tx-001);\n" +
    "• Para testar nova aposta: altere o valor (ex: prov-a:tx-002).",
  example: "prov-a:tx-001",
  required: true,
};

export const WageringApiBodyExample: ApiBodyOptions = {
  description:
    "Operação financeira de iGaming.\n" +
    "• walletId: Pré-preenchido com a carteira populada (ou pegue outra no GET /wallets);\n" +
    "• externalTransactionId: ID no provedor (altere para nova transação);\n" +
    "• kind: 'BET' (débito), 'WIN' (crédito), 'LOSS' (sem saldo) ou 'REFUND' (estorno);\n" +
    "• money.amount: Valor exato com 2 decimais (ex: '25.00').\n\n" +
    "DICA DE TESTE DE DUPLICATAS:\n" +
    "1. Clique em 'Execute' uma vez (status: PROCESSED, idempotentReplay: false);\n" +
    "2. Clique em 'Execute' de novo sem mudar nada (status: PROCESSED, idempotentReplay: true).",
  schema: {
    example: {
      providerId: "prov-a",
      externalTransactionId: "tx-001",
      playerId: "0192f28f-5dc0-7d58-bdb2-814ad6a0f4a1",
      walletId: "a1a1a1a1-1111-4000-8000-000000000001",
      roundId: "round-987",
      gameId: "fortune-chimp",
      kind: "BET",
      money: {
        amount: "25.00",
        currency: "BRL",
      },
    },
  },
};
