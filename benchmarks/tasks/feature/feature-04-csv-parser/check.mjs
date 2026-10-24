// check.mjs for feature-04-csv-parser
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const { parseCSV } = await import(pathToFileURL(resolve(workdir, "csv.js")).href);
const input = 'name, age, city\n"Smith, John", 30, New York\nAlice, 25, "London, UK"';
const res = parseCSV(input);
assert.equal(res.length, 2);
assert.deepEqual(res[0], { name: "Smith, John", age: "30", city: "New York" });
assert.deepEqual(res[1], { name: "Alice", age: "25", city: "London, UK" });
console.log("PASS");
