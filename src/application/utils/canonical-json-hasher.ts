import { createHash } from "crypto";

export function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  const sortedKeys = Object.keys(obj).sort();
  const sortedObj: Record<string, any> = {};
  for (const key of sortedKeys) {
    sortedObj[key] = sortObjectKeys(obj[key]);
  }
  return sortedObj;
}

export function hashCanonicalPayload(payload: Record<string, any>): string {
  const canonicalObj = sortObjectKeys(payload);
  const jsonStr = JSON.stringify(canonicalObj);
  return createHash("sha256").update(jsonStr).digest("hex");
}
