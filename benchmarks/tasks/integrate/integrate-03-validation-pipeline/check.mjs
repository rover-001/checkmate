// check.mjs for integrate-03-validation-pipeline
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const signupMod = await import(pathToFileURL(resolve(workdir, "src/routes/signup.js")).href);
assert.equal(typeof signupMod.validateSignup, "function");

assert.deepEqual(signupMod.validateSignup({ email: "user@test.com", password: "password123", age: 25 }), []);
assert.deepEqual(signupMod.validateSignup({ email: "bademail", password: "pwd", age: -1 }), ["invalid_email", "short_password", "invalid_age"]);

const fs = await import("node:fs");
const code = fs.readFileSync(resolve(workdir, "src/routes/signup.js"), "utf8");
assert.match(code, /isEmail\s*\(|isEmail\b/, "Must reuse isEmail");
assert.match(code, /hasMinLength\s*\(|hasMinLength\b/, "Must reuse hasMinLength");
assert.match(code, /isPositiveInt\s*\(|isPositiveInt\b/, "Must reuse isPositiveInt");
assert.doesNotMatch(code, /\/[^/\n\\]+@[^/\n\\]+\//, "Must not duplicate email regex pattern");
assert.doesNotMatch(code, /\bclass\s+[A-Z]/, "Must not introduce validator classes or schema engines");
console.log("PASS");
