// check.mjs for integrate-02-scoped-logger
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const { logStore } = await import(pathToFileURL(resolve(workdir, "src/logger.js")).href);
const billingMod = await import(pathToFileURL(resolve(workdir, "src/services/billing.js")).href);
assert.equal(typeof billingMod.processInvoice, "function", "processInvoice must be exported");

logStore.length = 0;
assert.equal(billingMod.processInvoice("inv-101", 50), true);
assert.ok(logStore.includes("[billing] [INFO] Processing invoice inv-101"));

assert.equal(billingMod.processInvoice("inv-102", -10), false);
assert.ok(logStore.includes("[billing] [ERROR] Invalid amount"));

const fs = await import("node:fs");
const code = fs.readFileSync(resolve(workdir, "src/services/billing.js"), "utf8");
assert.match(code, /createScopedLogger/, "Must reuse createScopedLogger from logger.js");
assert.doesNotMatch(code, /console\.(log|error|warn)/, "Must not call console.log directly");
assert.doesNotMatch(code, /\bclass\s+[A-Z]/, "Must not introduce logger classes or wrapper layers");
console.log("PASS");
