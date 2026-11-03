import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ApiQuery, ApiTags } from "@nestjs/swagger";
import { GetWalletLedgerUseCase } from "@application/use-cases/get-ledger/get-wallet-ledger.use-case";
import { isValidUuid } from "@application/operations/common/validation.utils";

@ApiTags("Wallets")
@Controller("wallets")
export class GetWalletLedgerController {
  constructor(private readonly useCase: GetWalletLedgerUseCase) {}

  @Get(":walletId/ledger")
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Quantidade de registros (opcional, padrão: 50)",
    example: 50,
  })
  @ApiQuery({
    name: "cursor",
    required: false,
    description: "Ponto no tempo para buscar páginas anteriores (opcional)",
  })
  async handle(
    @Param("walletId") walletId: string,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string
  ) {
    if (!isValidUuid(walletId)) {
      throw new HttpException(
        "Invalid walletId (must be a valid UUID)",
        HttpStatus.BAD_REQUEST
      );
    }

    const parsedLimit = limit ? Math.min(Math.max(Number(limit), 1), 100) : 50;
    return await this.useCase.execute(walletId, parsedLimit, cursor);
  }
}
