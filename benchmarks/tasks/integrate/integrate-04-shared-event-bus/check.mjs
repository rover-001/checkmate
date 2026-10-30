// check.mjs for integrate-04-shared-event-bus
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const { bus } = await import(pathToFileURL(resolve(workdir, "src/events/bus.js")).href);
const trackerMod = await import(pathToFileURL(resolve(workdir, "src/analytics/tracker.js")).href);
assert.equal(typeof trackerMod.attachTracker, "function");
assert.ok(trackerMod.trackerStats);

trackerMod.attachTracker();
bus.emit("track", { page: "/home" });
assert.equal(trackerMod.trackerStats.count, 1);
assert.deepEqual(trackerMod.trackerStats.lastEvent, { page: "/home" });

const fs = await import("node:fs");
const code = fs.readFileSync(resolve(workdir, "src/analytics/tracker.js"), "utf8");
assert.match(code, /\bbus\b/, "Must reuse bus from bus.js");
assert.doesNotMatch(code, /\bnew\s+Event(Emitter|Bus)\b/, "Must not instantiate duplicate event buses");
assert.doesNotMatch(code, /\bclass\s+[A-Z]/, "Must not introduce abstraction classes");
console.log("PASS");
