import { processOrder } from "./processOrder.js";
import assert from "node:assert/strict";

assert.equal(processOrder(null), "NO_ORDER");
assert.equal(processOrder({}), "INVALID_ID");
assert.equal(processOrder({ id: 1 }), "EMPTY");
assert.equal(processOrder({ id: 1, items: [1] }), "UNPAID");
assert.equal(processOrder({ id: 1, items: [1], paid: true }), "PROCESSED");
console.log("PASS");
