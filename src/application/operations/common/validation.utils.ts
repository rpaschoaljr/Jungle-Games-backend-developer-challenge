const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SAFE_IDENTIFIER_REGEX = /^[a-zA-Z0-9_\-.:]{1,128}$/;

export function isValidUuid(val: unknown): boolean {
  return typeof val === "string" && UUID_REGEX.test(val.trim());
}

export function isSafeIdentifier(val: unknown): boolean {
  return typeof val === "string" && SAFE_IDENTIFIER_REGEX.test(val.trim());
}

export function isValidMoneyProps(money: unknown): boolean {
  if (!money || typeof money !== "object") return false;
  const m = money as Record<string, unknown>;
  const isAmountValid =
    typeof m.amount === "string" && /^\d+\.\d{2}$/.test(m.amount.trim());
  const isCurrencyValid =
    typeof m.currency === "string" && /^[A-Z]{3}$/.test(m.currency.trim());
  return isAmountValid && isCurrencyValid;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
