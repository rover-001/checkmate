// check.mjs for integrate-06-currency-formatting
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const receiptMod = await import(pathToFileURL(resolve(workdir, "src/views/receipt.js")).href);
assert.equal(typeof receiptMod.generateReceipt, "function");

const items = [{ name: "Keyboard", cents: 4500 }, { name: "Mouse", cents: 2550 }];
const output = receiptMod.generateReceipt(items);
assert.equal(output, "Keyboard: $45.00\nMouse: $25.50\nTotal: $70.50");

const fs = await import("node:fs");
const code = fs.readFileSync(resolve(workdir, "src/views/receipt.js"), "utf8");
assert.match(code, /formatCents/, "Must reuse formatCents from money.js");
assert.doesNotMatch(code, /\.toFixed\(2\)/, "Must not duplicate toFixed currency logic");
assert.doesNotMatch(code, /\bclass\s+[A-Z]/, "Must not introduce receipt builder classes");
console.log("PASS");
