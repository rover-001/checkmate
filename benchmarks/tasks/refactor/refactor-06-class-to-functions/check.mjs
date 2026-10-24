// check.mjs for refactor-06-class-to-functions
import { join } from "node:path";
import { chdir } from "node:process";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const content = readFileSync("mathUtils.js", "utf8");
assert.ok(!content.includes("class "), "mathUtils.js must not contain 'class '");
