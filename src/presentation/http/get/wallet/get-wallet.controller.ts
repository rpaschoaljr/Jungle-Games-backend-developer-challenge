import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { GetWalletUseCase } from "@application/use-cases/get-wallet/get-wallet.use-case";
import { isValidUuid } from "@application/operations/common/validation.utils";

@ApiTags("Wallets")
@Controller("wallets")
export class GetWalletController {
  constructor(private readonly useCase: GetWalletUseCase) {}

  @Get()
  async listAll() {
    return await this.useCase.findAll();
  }

  @Get(":walletId")
  async handle(@Param("walletId") walletId: string) {
    if (!isValidUuid(walletId)) {
      throw new HttpException(
        "Invalid walletId (must be a valid UUID)",
        HttpStatus.BAD_REQUEST
      );
    }

    const wallet = await this.useCase.execute(walletId);
    if (!wallet) {
      throw new HttpException("Wallet not found", HttpStatus.NOT_FOUND);
    }
    return wallet;
  }
}
