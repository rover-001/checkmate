// check.mjs for qa-01-http-status
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const resultFilePath = process.argv[3];
if (!resultFilePath) {
  console.error("Missing result file argument");
  process.exit(1);
}

const text = readFileSync(resultFilePath, "utf8");
const regex = new RegExp("\\b418\\b", "i");
if (!regex.test(text)) {
  console.error("Failed: expected pattern /\\b418\\b/i in result: " + text);
  process.exit(1);
}
console.log("PASS");
process.exit(0);
