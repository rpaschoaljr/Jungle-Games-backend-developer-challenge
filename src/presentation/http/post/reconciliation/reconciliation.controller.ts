import { Controller, Post, Param, HttpException, HttpStatus } from "@nestjs/common";
import { ReconcileWalletUseCase } from "@application/use-cases/reconcile-wallet/reconcile-wallet.use-case";
import { isValidUuid } from "@application/operations/common/validation.utils";

@Controller("wallets")
export class ReconciliationController {
  constructor(private readonly reconcileWallet: ReconcileWalletUseCase) {}

  @Post(":walletId/reconciliation")
  async handle(@Param("walletId") walletId: string) {
    if (!isValidUuid(walletId)) {
      throw new HttpException("Invalid walletId UUID", HttpStatus.BAD_REQUEST);
    }
    try {
      return await this.reconcileWallet.execute(walletId);
    } catch (err: any) {
      if (err.message.includes("not found")) {
        throw new HttpException("Wallet not found", HttpStatus.NOT_FOUND);
      }
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
