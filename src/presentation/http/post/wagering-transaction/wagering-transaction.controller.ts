import {
  Controller,
  Post,
  Body,
  Headers,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ApiBody, ApiHeader, ApiTags } from "@nestjs/swagger";
import { ProcessWagerTransactionUseCase } from "@application/use-cases/process-wager/process-wager.use-case";
import { validateBetPayload } from "@application/operations/bet/bet.validator";
import { validateWinPayload } from "@application/operations/win/win.validator";
import { validateLossPayload } from "@application/operations/loss/loss.validator";
import { validateRefundPayload } from "@application/operations/refund/refund.validator";
import { validateRollbackPayload } from "@application/operations/rollback/rollback.validator";
import {
  WageringApiBodyExample,
  WageringHeaderExample,
} from "./wagering-transaction.swagger";

@ApiTags("Wagering")
@Controller("wagering/transactions")
export class WageringTransactionController {
  constructor(private readonly useCase: ProcessWagerTransactionUseCase) {}

  @Post()
  @ApiHeader(WageringHeaderExample)
  @ApiBody(WageringApiBodyExample)
  async handle(
    @Headers("Idempotency-Key") idempotencyKey: string | undefined,
    @Body() body: any
  ) {
    if (!idempotencyKey) {
      throw new HttpException(
        "Missing Idempotency-Key header",
        HttpStatus.BAD_REQUEST
      );
    }

    const validation = this.validateByKind(body);
    if (!validation.isValid) {
      throw new HttpException(
        { message: "Validation error", errors: validation.errors },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      return await this.useCase.execute({
        idempotencyKey,
        ...body,
      });
    } catch (err: any) {
      if (err.message?.includes("IDEMPOTENCY_CONFLICT")) {
        throw new HttpException(err.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        err.message || "Internal server error",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private validateByKind(body: any) {
    switch (body?.kind) {
      case "BET":
        return validateBetPayload(body);
      case "WIN":
        return validateWinPayload(body);
      case "LOSS":
        return validateLossPayload(body);
      case "REFUND":
        return validateRefundPayload(body);
      case "ROLLBACK":
        return validateRollbackPayload(body);
      default:
        return { isValid: false, errors: ["Invalid transaction kind"] };
    }
  }
}
