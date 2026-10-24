import { buildSummary } from "./buildSummary.js";
import assert from "node:assert/strict";

const out = buildSummary("apple: 10\nbanana: 20");
assert.equal(out, "Summary: 2 items, Total=30, Avg=15");
console.log("PASS");
