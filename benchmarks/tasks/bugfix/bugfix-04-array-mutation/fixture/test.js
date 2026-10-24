import { sortUsers } from "./sorter.js";
import assert from "node:assert/strict";

const original = [{ name: "Charlie" }, { name: "Alice" }, { name: "Bob" }];
const sorted = sortUsers(original);

assert.equal(sorted[0].name, "Alice");
assert.equal(original[0].name, "Charlie", "Input array must not be mutated");
console.log("PASS");
