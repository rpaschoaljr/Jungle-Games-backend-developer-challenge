import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { PostgresTransactionRepository } from "@infrastructure/database/repositories/postgres-transaction.repository";
import {
  isSafeIdentifier,
  isValidUuid,
} from "@application/operations/common/validation.utils";

@Controller()
export class GetTransactionController {
  constructor(private readonly txRepo: PostgresTransactionRepository) {}

  @Get("wagering/transactions/:transactionId")
  async getById(@Param("transactionId") id: string) {
    if (!isValidUuid(id)) {
      throw new HttpException("Invalid transactionId", HttpStatus.BAD_REQUEST);
    }
    const tx = await this.txRepo.findById(id);
    if (!tx) {
      throw new HttpException("Transaction not found", HttpStatus.NOT_FOUND);
    }
    return tx;
  }

  @Get("providers/:providerId/wagering/transactions/:externalTransactionId")
  async getByExternalId(
    @Param("providerId") providerId: string,
    @Param("externalTransactionId") externalTransactionId: string
  ) {
    if (!isSafeIdentifier(providerId) || !isSafeIdentifier(externalTransactionId)) {
      throw new HttpException("Invalid identifiers", HttpStatus.BAD_REQUEST);
    }
    const tx = await this.txRepo.findByExternalId(providerId, externalTransactionId);
    if (!tx) {
      throw new HttpException("Transaction not found", HttpStatus.NOT_FOUND);
    }
    return tx;
  }
}
