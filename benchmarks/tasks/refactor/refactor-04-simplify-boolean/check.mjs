// check.mjs for refactor-04-simplify-boolean
import { join } from "node:path";
import { chdir } from "node:process";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const lines = readFileSync("permissions.js", "utf8").trim().split("\n").length;
assert.ok(lines <= 20, `Expected <= 20 lines, got ${lines}`);
