import { validateBetPayload } from "../bet/bet.validator";
import { isSafeIdentifier, ValidationResult } from "../common/validation.utils";

export function validateRefundPayload(payload: any): ValidationResult {
  const baseResult = validateBetPayload(payload);
  const errors = [...baseResult.errors];

  if (!isSafeIdentifier(payload?.referenceExternalTransactionId)) {
    errors.push(
      "Missing or unsafe referenceExternalTransactionId for REFUND"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
