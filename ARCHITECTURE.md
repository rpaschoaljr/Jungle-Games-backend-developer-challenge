# Arquitetura do Sistema — Distributed Wagering Processor 🦧

## 1. Visão Geral e Clean Architecture (DDD)

A solução foi desenvolvida com **Clean Architecture** e **Domain-Driven Design (DDD)** dividida em quatro camadas estritas:

1. **Domain (`src/domain/`)**:
   - Totalmente puro: **não depende de decorators de ORM nem de pacotes do NestJS** (conforme regra da Seção 6.1).
   - `Money`: Value Object imutável com aritmética em centavos (`BigInt`) e regex estrito `^\d+\.\d{2}$`.
   - `Wallet`: Aggregate Root com saldo garantidamente não-negativo e versionamento atômico.
   - `WalletLedgerEntry`: Registro imutável de partidas dobradas verificando invariantemente `balanceBefore ± money === balanceAfter`.
   - `WagerTransaction`: Máquina de estados finita e terminal (`PENDING` -> `PROCESSED` / `REJECTED` / `FAILED`).

2. **Application (`src/application/`)**:
   - Portas e Interfaces: `IWalletRepository`, `IWagerTransactionRepository`, `ILedgerRepository`, `IOutboxRepository`, `IUnitOfWork`.
   - Casos de uso desacoplados: `ProcessWagerTransactionUseCase`, `CreateWalletUseCase`, `GetWalletUseCase`, `GetWalletLedgerUseCase`, `ReconcileWalletUseCase`.
   - Idempotência: `hashCanonicalPayload` gerando hash SHA-256 de JSON canônico com chaves ordenadas.

3. **Infrastructure (`src/infrastructure/`)**:
   - **MikroORM 7 (Opção Preferencial do Desafio)**:
     - Mapeamento via `EntitySchema` na camada de infraestrutura, preservando o domínio puro.
     - `MoneyCustomType`: Tipo personalizado mapeando `Money` diretamente para `NUMERIC(18, 2)` do Postgres sem conversão para floats.
     - `LockMode.PESSIMISTIC_WRITE`: Adquire lock exclusivo de linha (`SELECT ... FOR UPDATE`) na carteira.
   - **Mensageria AWS SQS**:
     - Fila FIFO: `wager-transactions.fifo` (`MessageGroupId = walletId`).
     - Transactional Outbox: Eventos persistidos na tabela `outbox_messages` na mesma transação atômica do PostgreSQL.
     - Inbox Consumer: Deduplicação persistente por `(consumerName, messageId)` antes de comitar.

4. **Presentation (`src/presentation/`)**:
   - Controllers NestJS modulares e documentados com OpenAPI/Swagger (`http://localhost:3000/docs`).
   - Ponto de extensão para autenticação OIDC (`NoopAuthGuard` e `IProviderIdentityPort`).
   - Health checks separados: `/health/live` e `/health/ready` (validando PostgreSQL 19 e AWS SQS simultaneamente).

---

## 2. Concorrência e Transacionalidade

- **Unidade de Concorrência**: `walletId`.
- **Row-Level Locking**: Cada transação financeira adquire lock exclusivo na linha da wallet via `LockMode.PESSIMISTIC_WRITE`. Wallets diferentes executam em paralelo com contenção zero.
- **Tolerância a Falhas**:
  - Queda do Postgres: Rollback atômico automático, reconexão transparente e retentativa limpa.
  - Queda do SQS: O Transactional Outbox retém os eventos no PostgreSQL até a fila voltar, garantindo zero perda de eventos.

---

## 3. Conformidade com as Restrições Invioláveis

- ✅ **Arquivos $\le$ 120 linhas**: Monitorado rigorosamente pelo script `bun run check:lines`.
- ✅ **Zero `number`, `float` ou `double`**: Cálculos em `BigInt` (centavos) e persistência em `NUMERIC(18, 2)`.
- ✅ **Testes com Containers Reais**: PostgreSQL 19rc1 e AWS SQS em Docker Compose, sem substituição por mocks.
- ✅ **Teste de Tempestade ($2^{16} = 65.536$ apostas)**: 100% íntegro com 3 quedas reais e zero perda.
