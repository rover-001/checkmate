// check.mjs for feature-01-slugify
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const { slugify } = await import(pathToFileURL(resolve(workdir, "index.js")).href);
assert.equal(slugify("Hello World!"), "hello-world");
assert.equal(slugify("  foo__bar--baz  "), "foo-bar-baz");
assert.equal(slugify("Special #$% Characters & Symbols"), "special-characters-symbols");
assert.equal(slugify("---already-hyphenated---"), "already-hyphenated");
console.log("PASS");
