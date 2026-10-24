import { track, flush } from "./analytics.js";
import assert from "node:assert/strict";

assert.equal(track("click").event, "click");
assert.equal(flush(), true);
console.log("PASS");
