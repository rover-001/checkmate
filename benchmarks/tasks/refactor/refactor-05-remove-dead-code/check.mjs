// check.mjs for refactor-05-remove-dead-code
import { join } from "node:path";
import { chdir } from "node:process";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const content = readFileSync("analytics.js", "utf8");
assert.ok(!content.includes("oldTrack"), "must not contain oldTrack");
assert.ok(!content.includes("legacyFormat"), "must not contain legacyFormat");
assert.ok(!content.includes("v1Payload"), "must not contain v1Payload");
