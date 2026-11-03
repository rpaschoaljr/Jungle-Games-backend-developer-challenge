import { readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";

const MAX_LINES = 120;
const DIRS_TO_CHECK = ["src", "tests", "scripts"];

function checkDirectory(dirPath: string): boolean {
  let hasViolation = false;
  const entries = readdirSync(dirPath);

  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!checkDirectory(fullPath)) {
        hasViolation = true;
      }
    } else if (entry.endsWith(".ts")) {
      const content = readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");
      if (lines.length > MAX_LINES) {
        console.error(
          `[ERROR] ${fullPath} has ${lines.length} lines (max: ${MAX_LINES})`
        );
        hasViolation = true;
      }
    }
  }

  return !hasViolation;
}

let ok = true;
for (const dir of DIRS_TO_CHECK) {
  try {
    if (!checkDirectory(dir)) {
      ok = false;
    }
  } catch {}
}

if (!ok) {
  process.exit(1);
} else {
  console.log("All files comply with the max 120 lines rule!");
}
