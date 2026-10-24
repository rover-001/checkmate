// check.mjs for refactor-08-decompose-function
import { join } from "node:path";
import { chdir } from "node:process";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const content = readFileSync("buildSummary.js", "utf8");
assert.ok(content.includes("parseData"), "must define parseData");
assert.ok(content.includes("computeMetrics"), "must define computeMetrics");
assert.ok(content.includes("formatReport"), "must define formatReport");
