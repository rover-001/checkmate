// check.mjs for feature-06-retry-async
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const { retry } = await import(pathToFileURL(resolve(workdir, "retry.js")).href);
let attempts = 0;
const res = await retry(async () => {
  attempts++;
  if (attempts < 3) throw new Error("fail " + attempts);
  return "success";
}, { maxRetries: 3, delayMs: 5 });

assert.equal(res, "success");
assert.equal(attempts, 3);

let failAttempts = 0;
await assert.rejects(async () => {
  await retry(async () => {
    failAttempts++;
    throw new Error("always fail");
  }, { maxRetries: 2, delayMs: 5 });
}, /always fail/);
assert.equal(failAttempts, 3);
console.log("PASS");
