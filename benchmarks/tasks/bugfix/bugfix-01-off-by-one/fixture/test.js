import { range } from "./range.js";
import assert from "node:assert/strict";

const nums = range(1, 5);
assert.deepEqual(nums, [1, 2, 3, 4, 5]);
console.log("PASS");
