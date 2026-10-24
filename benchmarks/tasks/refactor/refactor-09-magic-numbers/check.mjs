// check.mjs for refactor-09-magic-numbers
import { join } from "node:path";
import { chdir } from "node:process";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const content = readFileSync("pricing.js", "utf8");
assert.ok(content.includes("TAX_RATE"), "must define TAX_RATE");
assert.ok(content.includes("DISCOUNT_THRESHOLD"), "must define DISCOUNT_THRESHOLD");
assert.ok(content.includes("DISCOUNT_RATE"), "must define DISCOUNT_RATE");
assert.ok(content.includes("SHIPPING_FEE"), "must define SHIPPING_FEE");
