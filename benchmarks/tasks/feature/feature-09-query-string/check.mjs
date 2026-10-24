// check.mjs for feature-09-query-string
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const { stringify, parse } = await import(pathToFileURL(resolve(workdir, "query.js")).href);
const q = stringify({ search: "hello world", page: 2 });
assert.equal(q, "search=hello%20world&page=2");
const p = parse("?search=hello%20world&page=2");
assert.deepEqual(p, { search: "hello world", page: "2" });
assert.deepEqual(parse(""), {});
console.log("PASS");
