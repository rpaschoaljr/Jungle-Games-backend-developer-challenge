import { validateBetPayload } from "../bet/bet.validator";
import { ValidationResult } from "../common/validation.utils";

export function validateWinPayload(payload: any): ValidationResult {
  return validateBetPayload(payload);
}
