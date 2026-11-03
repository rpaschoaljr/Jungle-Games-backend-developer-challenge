import {
  isSafeIdentifier,
  isValidMoneyProps,
  isValidUuid,
  ValidationResult,
} from "../common/validation.utils";

export function validateBetPayload(payload: any): ValidationResult {
  const errors: string[] = [];

  if (!isSafeIdentifier(payload?.providerId)) {
    errors.push("Invalid or unsafe providerId");
  }
  if (!isSafeIdentifier(payload?.externalTransactionId)) {
    errors.push("Invalid or unsafe externalTransactionId");
  }
  if (!isValidUuid(payload?.playerId)) {
    errors.push("Invalid playerId (must be a valid UUID)");
  }
  if (!isValidUuid(payload?.walletId)) {
    errors.push("Invalid walletId (must be a valid UUID)");
  }
  if (!isSafeIdentifier(payload?.roundId)) {
    errors.push("Invalid or unsafe roundId");
  }
  if (!isSafeIdentifier(payload?.gameId)) {
    errors.push("Invalid or unsafe gameId");
  }
  if (!isValidMoneyProps(payload?.money)) {
    errors.push("Invalid money (must have amount 'XX.YY' and 3-letter currency)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
