import { loadConfig } from "./config.js";
import assert from "node:assert/strict";

const valid = loadConfig('{"port": 8080}', { port: 3000 });
assert.equal(valid.port, 8080);

const fallback = loadConfig('{ broken json...', { port: 3000 });
assert.equal(fallback.port, 3000);
console.log("PASS");
