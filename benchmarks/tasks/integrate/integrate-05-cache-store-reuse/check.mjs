// check.mjs for integrate-05-cache-store-reuse
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const { cacheStore } = await import(pathToFileURL(resolve(workdir, "src/cache/store.js")).href);
const catalogMod = await import(pathToFileURL(resolve(workdir, "src/services/catalog.js")).href);
assert.equal(typeof catalogMod.getCatalogItem, "function");

cacheStore.clear();
let calls = 0;
const loader = async () => { calls++; return { id: "p1", name: "Widget" }; };

const r1 = await catalogMod.getCatalogItem("p1", loader);
const r2 = await catalogMod.getCatalogItem("p1", loader);
assert.equal(calls, 1, "Loader must only be called once when cached");
assert.equal(r1.name, "Widget");
assert.equal(r2.name, "Widget");
assert.ok(cacheStore.has("item:p1"));

const fs = await import("node:fs");
const code = fs.readFileSync(resolve(workdir, "src/services/catalog.js"), "utf8");
assert.match(code, /getOrSet/, "Must reuse getOrSet from store.js");
assert.doesNotMatch(code, /\bnew\s+Map\b/, "Must not declare a new Map cache");
assert.doesNotMatch(code, /\bclass\s+[A-Z]/, "Must not introduce caching service classes");
console.log("PASS");
