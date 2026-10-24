// check.mjs for refactor-01-extract-helper
import { join } from "node:path";
import { chdir } from "node:process";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const lines = readFileSync("report.js", "utf8").trim().split("\n").length;
assert.ok(lines <= 45, `Expected report.js <= 45 lines, got ${lines}`);
