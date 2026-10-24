// check.mjs for feature-03-event-emitter
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const { EventEmitter } = await import(pathToFileURL(resolve(workdir, "events.js")).href);
const ee = new EventEmitter();
let count = 0;
const fn = (v) => { count += v; };
ee.on("add", fn);
assert.equal(ee.emit("add", 2), true);
assert.equal(count, 2);
ee.off("add", fn);
assert.equal(ee.emit("add", 2), false);
assert.equal(count, 2);

let onceCount = 0;
ee.once("single", () => { onceCount++; });
ee.emit("single");
ee.emit("single");
assert.equal(onceCount, 1);
console.log("PASS");
