import { validateRefundPayload } from "../refund/refund.validator";
import { ValidationResult } from "../common/validation.utils";

export function validateRollbackPayload(payload: any): ValidationResult {
  return validateRefundPayload(payload);
}
