// check.mjs for qa-08-pkg-version
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const resultFilePath = process.argv[3];
if (!resultFilePath) {
  console.error("Missing result file argument");
  process.exit(1);
}

const text = readFileSync(resultFilePath, "utf8");
const regex = new RegExp("\\^3\\.22\\.4", "i");
if (!regex.test(text)) {
  console.error("Failed: expected pattern /\\^3\\.22\\.4/i in result: " + text);
  process.exit(1);
}
console.log("PASS");
process.exit(0);
