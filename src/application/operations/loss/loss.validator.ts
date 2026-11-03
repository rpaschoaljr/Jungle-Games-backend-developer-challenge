import { validateBetPayload } from "../bet/bet.validator";
import { ValidationResult } from "../common/validation.utils";

export function validateLossPayload(payload: any): ValidationResult {
  return validateBetPayload(payload);
}
