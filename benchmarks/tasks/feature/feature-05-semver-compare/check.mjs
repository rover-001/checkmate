// check.mjs for feature-05-semver-compare
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const { compare } = await import(pathToFileURL(resolve(workdir, "semver.js")).href);
assert.equal(compare("1.2.3", "1.2.4"), -1);
assert.equal(compare("2.0.0", "1.9.9"), 1);
assert.equal(compare("1.10.0", "1.2.0"), 1);
assert.equal(compare("3.4.5", "3.4.5"), 0);
console.log("PASS");
