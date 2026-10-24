import { deepExtend } from "./extend.js";
import assert from "node:assert/strict";

const payload = JSON.parse('{"__proto__": {"polluted": true}}');
const obj = {};
deepExtend(obj, payload);

assert.equal({}.polluted, undefined, "Object prototype must not be polluted");
console.log("PASS");
