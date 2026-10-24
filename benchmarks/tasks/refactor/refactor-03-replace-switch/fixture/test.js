import { calculate } from "./calculator.js";
import assert from "node:assert/strict";

assert.equal(calculate("add", 2, 3), 5);
assert.equal(calculate("sub", 10, 4), 6);
assert.equal(calculate("mul", 3, 3), 9);
assert.equal(calculate("div", 8, 2), 4);
assert.equal(calculate("div", 8, 0), null);
console.log("PASS");
