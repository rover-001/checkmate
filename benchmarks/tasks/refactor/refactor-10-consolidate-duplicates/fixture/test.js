import { validateUsername, validateEmail, validateTitle, validateBio } from "./validatorRules.js";
import assert from "node:assert/strict";

assert.equal(validateUsername("alice"), true);
assert.equal(validateUsername(""), false);
assert.equal(validateEmail("a@b.com"), true);
assert.equal(validateTitle("A title"), true);
assert.equal(validateBio("Bio text"), true);
console.log("PASS");
