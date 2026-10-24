// check.mjs for refactor-02-flatten-nesting
import { join } from "node:path";
import { chdir } from "node:process";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const content = readFileSync("processOrder.js", "utf8");
const lines = content.split("\n");
for (const line of lines) {
  if (line.trim().length === 0) continue;
  const match = line.match(/^(\s+)/);
  const indent = match ? match[1].length : 0;
  assert.ok(indent <= 8, `Line exceeded max indent of 8 spaces: "${line}"`);
}
