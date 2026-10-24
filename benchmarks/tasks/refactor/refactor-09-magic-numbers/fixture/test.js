import { calculateTotal } from "./pricing.js";
import assert from "node:assert/strict";

const total = calculateTotal(200);
assert.equal(Math.round(total * 100) / 100, 220.68);
console.log("PASS");
