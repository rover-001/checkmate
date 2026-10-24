import { generateUserReport } from "./report.js";
import assert from "node:assert/strict";

const r = generateUserReport({ name: "alice", balance: 50.5, createdAt: "2026-01-15T12:00:00Z" });
assert.equal(r.summary, "USER: ALICE | BALANCE: $50.50 | SINCE: 2026-01-15");
assert.equal(r.auditTotal, 22);
console.log("PASS");
