// check.mjs for integrate-01-auth-header
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const ordersMod = await import(pathToFileURL(resolve(workdir, "src/api/orders.js")).href);
assert.equal(typeof ordersMod.fetchOrder, "function", "fetchOrder must be exported");

const res = await ordersMod.fetchOrder("ord-99", "tok-xyz");
assert.equal(res.status, 200);
assert.equal(res.url, "/orders/ord-99");
assert.equal(res.headers.Authorization, "Bearer tok-xyz");

const fs = await import("node:fs");
const code = fs.readFileSync(resolve(workdir, "src/api/orders.js"), "utf8");
assert.match(code, /buildAuthHeader/, "Must reuse buildAuthHeader from client.js");
assert.doesNotMatch(code, /`Bearer\s|\bBearer\s*['"]/i, "Must not duplicate Bearer string formatting");
assert.doesNotMatch(code, /\bclass\s+[A-Z]/, "Must not introduce unnecessary classes or wrappers");
console.log("PASS");
