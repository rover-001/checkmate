import { isValidEmail } from "./validator.js";
import assert from "node:assert/strict";

assert.equal(isValidEmail("user+tag@example.com"), true);
assert.equal(isValidEmail("normal.user@sub.domain.org"), true);
assert.equal(isValidEmail("not-an-email"), false);
console.log("PASS");
