// check.mjs for feature-08-rate-limiter
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const { TokenBucket } = await import(pathToFileURL(resolve(workdir, "limiter.js")).href);
const bucket = new TokenBucket(2, 10);
assert.equal(bucket.tryConsume(1), true);
assert.equal(bucket.tryConsume(1), true);
assert.equal(bucket.tryConsume(1), false);
await new Promise(r => setTimeout(r, 110)); // refills at least 1 token
assert.equal(bucket.tryConsume(1), true);
console.log("PASS");
