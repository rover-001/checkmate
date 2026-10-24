import { fetchUserData } from "./fetchUser.js";
import assert from "node:assert/strict";

const ok = await fetchUserData(async () => "data");
assert.equal(ok.status, "ok");

const fail = await fetchUserData(async () => {
  throw new Error("network timeout");
});
assert.equal(fail.error, "network timeout");
console.log("PASS");
