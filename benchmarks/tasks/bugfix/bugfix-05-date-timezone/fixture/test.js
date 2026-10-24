import { formatISODate } from "./formatter.js";
import assert from "node:assert/strict";

// 2026-05-01T00:30:00Z should always format as 2026-05-01 in UTC
const d = new Date("2026-05-01T00:30:00Z");
assert.equal(formatISODate(d), "2026-05-01");
console.log("PASS");
