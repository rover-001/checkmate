// check.mjs for integrate-08-date-utils-reuse
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const planMod = await import(pathToFileURL(resolve(workdir, "src/membership/plan.js")).href);
assert.equal(typeof planMod.checkPlanStatus, "function");

const baseTime = new Date("2026-10-30T12:00:00Z");
const pastTime = new Date("2026-10-25T12:00:00Z");
const futureTime = new Date("2026-11-04T12:00:00Z");

assert.equal(planMod.checkPlanStatus(pastTime, baseTime), "expired");
assert.equal(planMod.checkPlanStatus(futureTime, baseTime), "active: 5 days");

const fs = await import("node:fs");
const code = fs.readFileSync(resolve(workdir, "src/membership/plan.js"), "utf8");
assert.match(code, /isPastDate/, "Must reuse isPastDate from dateUtils.js");
assert.match(code, /daysBetween/, "Must reuse daysBetween from dateUtils.js");
assert.doesNotMatch(code, /86400|1000\s*\*\s*60/, "Must not duplicate millisecond conversion arithmetic");
assert.doesNotMatch(code, /\bclass\s+[A-Z]/, "Must not introduce abstraction classes");
console.log("PASS");
