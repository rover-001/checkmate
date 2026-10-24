import { canAccess } from "./permissions.js";
import assert from "node:assert/strict";

assert.equal(canAccess(null, {}), false);
assert.equal(canAccess({ isAdmin: true }, {}), true);
assert.equal(canAccess({ isActive: true, id: 1 }, { isPublic: true, ownerId: 2 }), true);
assert.equal(canAccess({ isActive: true, id: 1 }, { isPublic: false, ownerId: 1 }), true);
assert.equal(canAccess({ isActive: true, id: 1 }, { isPublic: false, ownerId: 2 }), false);
console.log("PASS");
