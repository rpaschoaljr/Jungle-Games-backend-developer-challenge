import { Module } from "@nestjs/common";
import { DatabasePool } from "@infrastructure/database/postgres.pool";
import { MikroOrmUnitOfWork } from "@infrastructure/database/orm/mikro-unit-of-work";
import { PostgresWalletRepository } from "@infrastructure/database/repositories/postgres-wallet.repository";
import { PostgresTransactionRepository } from "@infrastructure/database/repositories/postgres-transaction.repository";
import { PostgresLedgerRepository } from "@infrastructure/database/repositories/postgres-ledger.repository";
import { CreateWalletUseCase } from "@application/use-cases/create-wallet/create-wallet.use-case";
import { ProcessWagerTransactionUseCase } from "@application/use-cases/process-wager/process-wager.use-case";
import { GetWalletUseCase } from "@application/use-cases/get-wallet/get-wallet.use-case";
import { GetWalletLedgerUseCase } from "@application/use-cases/get-ledger/get-wallet-ledger.use-case";
import { ReconcileWalletUseCase } from "@application/use-cases/reconcile-wallet/reconcile-wallet.use-case";
import { WageringTransactionController } from "@presentation/http/post/wagering-transaction/wagering-transaction.controller";
import { CreateWalletController } from "@presentation/http/post/create-wallet/create-wallet.controller";
import { ReconciliationController } from "@presentation/http/post/reconciliation/reconciliation.controller";
import { GetWalletController } from "@presentation/http/get/wallet/get-wallet.controller";
import { GetWalletLedgerController } from "@presentation/http/get/ledger/get-wallet-ledger.controller";
import { GetTransactionController } from "@presentation/http/get/transaction/get-transaction.controller";
import { DatabaseHealthController } from "@presentation/http/health/database/database-health.controller";
import { LiveHealthController } from "@presentation/http/health/live/live-health.controller";
import { MetricsController } from "@presentation/http/observability/metrics.controller";
import { MetricsService } from "@presentation/http/observability/metrics.service";

@Module({
  controllers: [
    WageringTransactionController,
    CreateWalletController,
    ReconciliationController,
    GetWalletController,
    GetWalletLedgerController,
    GetTransactionController,
    DatabaseHealthController,
    LiveHealthController,
    MetricsController,
  ],
  providers: [
    MetricsService,
    {
      provide: "UNIT_OF_WORK",
      useClass: MikroOrmUnitOfWork,
    },
    {
      provide: PostgresWalletRepository,
      useFactory: () => new PostgresWalletRepository(DatabasePool.getPool()),
    },
    {
      provide: PostgresTransactionRepository,
      useFactory: () => new PostgresTransactionRepository(DatabasePool.getPool()),
    },
    {
      provide: PostgresLedgerRepository,
      useFactory: () => new PostgresLedgerRepository(DatabasePool.getPool()),
    },
    {
      provide: CreateWalletUseCase,
      useFactory: (uow: MikroOrmUnitOfWork) => new CreateWalletUseCase(uow),
      inject: ["UNIT_OF_WORK"],
    },
    {
      provide: ProcessWagerTransactionUseCase,
      useFactory: (uow: MikroOrmUnitOfWork) => new ProcessWagerTransactionUseCase(uow),
      inject: ["UNIT_OF_WORK"],
    },
    {
      provide: GetWalletUseCase,
      useFactory: (repo: PostgresWalletRepository) => new GetWalletUseCase(repo),
      inject: [PostgresWalletRepository],
    },
    {
      provide: GetWalletLedgerUseCase,
      useFactory: (repo: PostgresLedgerRepository) => new GetWalletLedgerUseCase(repo),
      inject: [PostgresLedgerRepository],
    },
    {
      provide: ReconcileWalletUseCase,
      useFactory: (
        walletRepo: PostgresWalletRepository,
        ledgerRepo: PostgresLedgerRepository
      ) => new ReconcileWalletUseCase(walletRepo, ledgerRepo),
      inject: [PostgresWalletRepository, PostgresLedgerRepository],
    },
    {
      provide: "TRANSACTION_REPO",
      useExisting: PostgresTransactionRepository,
    },
  ],
})
export class AppModule {}
