// check.mjs for feature-07-deep-merge
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const { deepMerge } = await import(pathToFileURL(resolve(workdir, "merge.js")).href);
const t = { a: 1, b: { x: 10, y: 20 }, arr: [1] };
const s = { b: { y: 99, z: 30 }, arr: [2, 3], c: true };
const merged = deepMerge(t, s);

assert.deepEqual(merged, {
  a: 1,
  b: { x: 10, y: 99, z: 30 },
  arr: [2, 3],
  c: true
});
assert.equal(t.b.y, 20, "target must not be mutated");
assert.equal(s.b.y, 99, "source must not be mutated");
console.log("PASS");
