// check.mjs for refactor-10-consolidate-duplicates
import { join } from "node:path";
import { chdir } from "node:process";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const content = readFileSync("validatorRules.js", "utf8");
assert.ok(content.includes("isNonEmptyString"), "must define isNonEmptyString");
const lines = content.trim().split("\n").length;
assert.ok(lines <= 45, `Expected <= 45 lines, got ${lines}`);
