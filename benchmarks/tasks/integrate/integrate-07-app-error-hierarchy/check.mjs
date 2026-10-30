// check.mjs for integrate-07-app-error-hierarchy
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const { AppError, isAppError } = await import(pathToFileURL(resolve(workdir, "src/errors/AppError.js")).href);
const userMod = await import(pathToFileURL(resolve(workdir, "src/handlers/userHandler.js")).href);
assert.equal(typeof userMod.findUserOrThrow, "function");

const users = [{ id: "u1", name: "Alice" }, { id: "u2", name: "Bob" }];
assert.deepEqual(userMod.findUserOrThrow(users, "u1"), { id: "u1", name: "Alice" });

let threw = false;
try {
  userMod.findUserOrThrow(users, "u999");
} catch (err) {
  threw = true;
  assert.ok(isAppError(err));
  assert.equal(err.statusCode, 404);
  assert.equal(err.code, "USER_NOT_FOUND");
  assert.equal(err.message, "User not found");
}
assert.ok(threw, "Must throw AppError when user not found");

const fs = await import("node:fs");
const code = fs.readFileSync(resolve(workdir, "src/handlers/userHandler.js"), "utf8");
assert.match(code, /AppError/, "Must reuse AppError from AppError.js");
assert.doesNotMatch(code, /extends\s+Error/, "Must not declare new Error subclasses");
assert.doesNotMatch(code, /\bclass\s+[A-Z]/, "Must not introduce abstraction classes");
console.log("PASS");
