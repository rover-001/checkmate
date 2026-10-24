import * as mod from "./mathUtils.js";
import assert from "node:assert/strict";

// Supports both namespace/named function imports
const add = mod.add || mod.MathUtils?.add;
const multiply = mod.multiply || mod.MathUtils?.multiply;
const clamp = mod.clamp || mod.MathUtils?.clamp;

assert.equal(add(2, 3), 5);
assert.equal(multiply(4, 5), 20);
assert.equal(clamp(15, 0, 10), 10);
console.log("PASS");
