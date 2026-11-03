# Distributed Wagering Processor 🦧

Serviço financeiro distribuído de alta concorrência para processamento de apostas (iGaming), construído com Bun, TypeScript, NestJS, **MikroORM** e PostgreSQL 19rc1, seguindo Clean Architecture, TDD e arquivos modulares estritamente limitados a 120 linhas.

---

## 🚀 Como Iniciar o Projeto

Basta um único comando:

```bash
bun run start:dev
```

### O que esse comando faz automaticamente:
1. Sobe os containers **PostgreSQL 19rc1** e **AWS SQS** via Docker Compose.
2. Aguarda o PostgreSQL estar saudável (`SELECT 1`).
3. Executa as **migrations SQL** de banco (`src/infrastructure/database/migrations/`).
4. Inicia a API NestJS em modo watch em `http://localhost:3000`.
5. Disponibiliza a documentação Swagger OpenAPI em `http://localhost:3000/docs`.
6. **Ao pressionar `Ctrl+C`**: captura `SIGINT` e desliga os containers de forma limpa (`docker compose down`).

---

## 🧪 Como Rodar os Testes

```bash
# Rodar todos os testes unitários e de integração
bun test

# Rodar o teste de alta concorrência (Section 8 e 50 requisições simultâneas)
bun run test:concurrency

# Rodar o teste de carga extrema com 65.536 apostas e 3 quedas de infraestrutura
bun run test:load

# Verificar se nenhum arquivo ultrapassa o limite de 120 linhas
bun run check:lines
```

---

## 📡 Endpoints Disponíveis

### 1. Criar Carteira
```bash
curl -X POST http://localhost:3000/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "0192f28f-5dc0-7d58-bdb2-814ad6a0f4a1",
    "initialBalance": { "amount": "1000.00", "currency": "BRL" }
  }'
```

### 2. Submeter Transação de Aposta (BET)
```bash
curl -X POST http://localhost:3000/wagering/transactions \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: prov-a:tx-100" \
  -d '{
    "providerId": "prov-a",
    "externalTransactionId": "tx-100",
    "playerId": "0192f28f-5dc0-7d58-bdb2-814ad6a0f4a1",
    "walletId": "<WALLET_ID>",
    "roundId": "round-987",
    "gameId": "fortune-tiger",
    "kind": "BET",
    "money": { "amount": "25.00", "currency": "BRL" }
  }'
```

### 3. Consultar Saldo da Carteira
```bash
curl http://localhost:3000/wallets/<WALLET_ID>
```

### 4. Consultar Extrato (Ledger)
```bash
curl http://localhost:3000/wallets/<WALLET_ID>/ledger
```

### 5. Reconciliação Contábil da Carteira
```bash
curl -X POST http://localhost:3000/wallets/<WALLET_ID>/reconciliation
```

### 6. Health Checks
```bash
curl http://localhost:3000/health/ready
curl http://localhost:3000/health/live
```
