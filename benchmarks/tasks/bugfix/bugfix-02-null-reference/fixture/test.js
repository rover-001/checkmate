import { getNested } from "./getNested.js";
import assert from "node:assert/strict";

assert.equal(getNested({ a: { b: 42 } }, "a.b"), 42);
assert.equal(getNested({ a: null }, "a.b"), undefined);
assert.equal(getNested(null, "a.b"), undefined);
console.log("PASS");
