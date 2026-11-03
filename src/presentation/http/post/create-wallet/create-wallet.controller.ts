import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ApiBody, ApiTags } from "@nestjs/swagger";
import { CreateWalletUseCase } from "@application/use-cases/create-wallet/create-wallet.use-case";
import {
  isValidMoneyProps,
  isValidUuid,
} from "@application/operations/common/validation.utils";
import { CreateWalletApiBody } from "./create-wallet.swagger";

@ApiTags("Wallets")
@Controller("wallets")
export class CreateWalletController {
  constructor(private readonly useCase: CreateWalletUseCase) {}

  @Post()
  @ApiBody(CreateWalletApiBody)
  async handle(@Body() body: any) {
    if (!isValidUuid(body?.playerId)) {
      throw new HttpException(
        "Invalid playerId (must be a valid UUID)",
        HttpStatus.BAD_REQUEST
      );
    }
    if (!isValidMoneyProps(body?.initialBalance)) {
      throw new HttpException(
        "Invalid initialBalance (must have amount 'XX.YY' and currency)",
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      return await this.useCase.execute({
        playerId: body.playerId,
        initialBalance: body.initialBalance,
      });
    } catch (err: any) {
      if (err.message?.includes("uq_wallets_player_currency")) {
        throw new HttpException(
          "Wallet already exists for this player and currency",
          HttpStatus.CONFLICT
        );
      }
      throw new HttpException(
        err.message || "Failed to create wallet",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
