// check.mjs for feature-02-lru-cache
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const { LRUCache } = await import(pathToFileURL(resolve(workdir, "cache.js")).href);
const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
assert.equal(cache.get(1), 1);
cache.put(3, 3); // evicts 2
assert.equal(cache.get(2), -1);
cache.put(4, 4); // evicts 1
assert.equal(cache.get(1), -1);
assert.equal(cache.get(3), 3);
assert.equal(cache.get(4), 4);
console.log("PASS");
