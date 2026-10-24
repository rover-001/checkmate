import { addCurrency } from "./money.js";
import assert from "node:assert/strict";

assert.equal(addCurrency(0.1, 0.2), 0.3);
assert.equal(addCurrency(10.255, 0.005), 10.26);
console.log("PASS");
