// benchmarks/setup-tasks.mjs — Generator for all 40 benchmark tasks
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TASKS = [
  // ==========================================
  // FEATURE TASKS (10)
  // ==========================================
  {
    id: "feature-01-slugify",
    bucket: "feature",
    prompt: "In index.js, implement export function slugify(str) that converts a string to lower-case, replaces spaces and underscores with hyphens, removes all non-alphanumeric characters except hyphens, and collapses multiple consecutive hyphens into a single hyphen. It should also trim leading and trailing hyphens. Export it as named export slugify.",
    fixture: {
      "index.js": 'export function slugify(str) {\n  throw new Error("Not implemented");\n}\n'
    },
    check: `const { slugify } = await import(pathToFileURL(resolve(workdir, "index.js")).href);
assert.equal(slugify("Hello World!"), "hello-world");
assert.equal(slugify("  foo__bar--baz  "), "foo-bar-baz");
assert.equal(slugify("Special #$% Characters & Symbols"), "special-characters-symbols");
assert.equal(slugify("---already-hyphenated---"), "already-hyphenated");
console.log("PASS");
`,
    reference: {
      "index.js": `export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[\\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
`
    }
  },
  {
    id: "feature-02-lru-cache",
    bucket: "feature",
    prompt: "In cache.js, implement class LRUCache with constructor(capacity) and methods get(key) and put(key, value). get(key) returns the value if present, or -1 if not. put(key, value) sets or updates key. If keys exceed capacity, it evicts the least recently used key. Export LRUCache as a named export.",
    fixture: {
      "cache.js": `export class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
  }
  get(key) { return -1; }
  put(key, value) {}
}
`
    },
    check: `const { LRUCache } = await import(pathToFileURL(resolve(workdir, "cache.js")).href);
const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
assert.equal(cache.get(1), 1);
cache.put(3, 3); // evicts 2
assert.equal(cache.get(2), -1);
cache.put(4, 4); // evicts 1
assert.equal(cache.get(1), -1);
assert.equal(cache.get(3), 3);
assert.equal(cache.get(4), 4);
console.log("PASS");
`,
    reference: {
      "cache.js": `export class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }
  put(key, value) {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
    this.map.set(key, value);
  }
}
`
    }
  },
  {
    id: "feature-03-event-emitter",
    bucket: "feature",
    prompt: "In events.js, implement class EventEmitter with methods on(event, listener), off(event, listener), once(event, listener), and emit(event, ...args). emit returns true if event had listeners, false otherwise. Export EventEmitter as named export.",
    fixture: {
      "events.js": `export class EventEmitter {
  on(event, fn) {}
  off(event, fn) {}
  once(event, fn) {}
  emit(event, ...args) { return false; }
}
`
    },
    check: `const { EventEmitter } = await import(pathToFileURL(resolve(workdir, "events.js")).href);
const ee = new EventEmitter();
let count = 0;
const fn = (v) => { count += v; };
ee.on("add", fn);
assert.equal(ee.emit("add", 2), true);
assert.equal(count, 2);
ee.off("add", fn);
assert.equal(ee.emit("add", 2), false);
assert.equal(count, 2);

let onceCount = 0;
ee.once("single", () => { onceCount++; });
ee.emit("single");
ee.emit("single");
assert.equal(onceCount, 1);
console.log("PASS");
`,
    reference: {
      "events.js": `export class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }
  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
  }
  off(event, fn) {
    if (!this.listeners.has(event)) return;
    const list = this.listeners.get(event).filter((l) => l !== fn && l._original !== fn);
    this.listeners.set(event, list);
  }
  once(event, fn) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      fn(...args);
    };
    wrapper._original = fn;
    this.on(event, wrapper);
  }
  emit(event, ...args) {
    if (!this.listeners.has(event)) return false;
    const list = [...this.listeners.get(event)];
    if (list.length === 0) return false;
    for (const fn of list) fn(...args);
    return true;
  }
}
`
    }
  },
  {
    id: "feature-04-csv-parser",
    bucket: "feature",
    prompt: "In csv.js, implement export function parseCSV(text) that parses a CSV string into an array of objects. The first row defines the keys (headers). Handle comma separators, quoted fields with commas inside (e.g. \"Doe, John\"), and trimmed field values. Export parseCSV as named export.",
    fixture: {
      "csv.js": `export function parseCSV(text) {
  return [];
}
`
    },
    check: `const { parseCSV } = await import(pathToFileURL(resolve(workdir, "csv.js")).href);
const input = 'name, age, city\\n"Smith, John", 30, New York\\nAlice, 25, "London, UK"';
const res = parseCSV(input);
assert.equal(res.length, 2);
assert.deepEqual(res[0], { name: "Smith, John", age: "30", city: "New York" });
assert.deepEqual(res[1], { name: "Alice", age: "25", city: "London, UK" });
console.log("PASS");
`,
    reference: {
      "csv.js": `export function parseCSV(text) {
  const lines = text.trim().split(/\\r?\\n/).filter(Boolean);
  if (lines.length === 0) return [];
  
  function parseLine(line) {
    const fields = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        fields.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    fields.push(cur.trim());
    return fields;
  }

  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = vals[idx] !== undefined ? vals[idx] : "";
    });
    rows.push(obj);
  }
  return rows;
}
`
    }
  },
  {
    id: "feature-05-semver-compare",
    bucket: "feature",
    prompt: "In semver.js, implement export function compare(v1, v2) that takes two semver strings 'MAJOR.MINOR.PATCH' (e.g. '1.2.3') and returns 1 if v1 > v2, -1 if v1 < v2, and 0 if v1 === v2. Compare numerically by major, minor, patch.",
    fixture: {
      "semver.js": `export function compare(v1, v2) {
  return 0;
}
`
    },
    check: `const { compare } = await import(pathToFileURL(resolve(workdir, "semver.js")).href);
assert.equal(compare("1.2.3", "1.2.4"), -1);
assert.equal(compare("2.0.0", "1.9.9"), 1);
assert.equal(compare("1.10.0", "1.2.0"), 1);
assert.equal(compare("3.4.5", "3.4.5"), 0);
console.log("PASS");
`,
    reference: {
      "semver.js": `export function compare(v1, v2) {
  const p1 = v1.split(".").map(Number);
  const p2 = v2.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (p1[i] > p2[i]) return 1;
    if (p1[i] < p2[i]) return -1;
  }
  return 0;
}
`
    }
  },
  {
    id: "feature-06-retry-async",
    bucket: "feature",
    prompt: "In retry.js, implement export async function retry(fn, { maxRetries = 3, delayMs = 10 } = {}). It executes async function fn(). If fn rejects, it waits delayMs and retries up to maxRetries attempts. If all fail, it rejects with the last caught error.",
    fixture: {
      "retry.js": `export async function retry(fn, options) {
  return fn();
}
`
    },
    check: `const { retry } = await import(pathToFileURL(resolve(workdir, "retry.js")).href);
let attempts = 0;
const res = await retry(async () => {
  attempts++;
  if (attempts < 3) throw new Error("fail " + attempts);
  return "success";
}, { maxRetries: 3, delayMs: 5 });

assert.equal(res, "success");
assert.equal(attempts, 3);

let failAttempts = 0;
await assert.rejects(async () => {
  await retry(async () => {
    failAttempts++;
    throw new Error("always fail");
  }, { maxRetries: 2, delayMs: 5 });
}, /always fail/);
assert.equal(failAttempts, 3);
console.log("PASS");
`,
    reference: {
      "retry.js": `export async function retry(fn, { maxRetries = 3, delayMs = 10 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries && delayMs > 0) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  }
  throw lastErr;
}
`
    }
  },
  {
    id: "feature-07-deep-merge",
    bucket: "feature",
    prompt: "In merge.js, implement export function deepMerge(target, source) that recursively merges plain objects from source into target, returning a new object without mutating target or source. Arrays and primitives from source overwrite target.",
    fixture: {
      "merge.js": `export function deepMerge(target, source) {
  return Object.assign({}, target, source);
}
`
    },
    check: `const { deepMerge } = await import(pathToFileURL(resolve(workdir, "merge.js")).href);
const t = { a: 1, b: { x: 10, y: 20 }, arr: [1] };
const s = { b: { y: 99, z: 30 }, arr: [2, 3], c: true };
const merged = deepMerge(t, s);

assert.deepEqual(merged, {
  a: 1,
  b: { x: 10, y: 99, z: 30 },
  arr: [2, 3],
  c: true
});
assert.equal(t.b.y, 20, "target must not be mutated");
assert.equal(s.b.y, 99, "source must not be mutated");
console.log("PASS");
`,
    reference: {
      "merge.js": `export function deepMerge(target, source) {
  const isObject = (item) => item && typeof item === "object" && !Array.isArray(item);
  const result = Object.assign({}, target);
  for (const key of Object.keys(source)) {
    if (isObject(source[key]) && isObject(target[key])) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
`
    }
  },
  {
    id: "feature-08-rate-limiter",
    bucket: "feature",
    prompt: "In limiter.js, implement class TokenBucket with constructor(capacity, refillRatePerSec) where tokens start at capacity. Implement method tryConsume(tokens = 1) which refills tokens based on elapsed time (capped at capacity), and returns true if sufficient tokens were consumed, or false otherwise.",
    fixture: {
      "limiter.js": `export class TokenBucket {
  constructor(capacity, refillRate) {}
  tryConsume() { return false; }
}
`
    },
    check: `const { TokenBucket } = await import(pathToFileURL(resolve(workdir, "limiter.js")).href);
const bucket = new TokenBucket(2, 10);
assert.equal(bucket.tryConsume(1), true);
assert.equal(bucket.tryConsume(1), true);
assert.equal(bucket.tryConsume(1), false);
await new Promise(r => setTimeout(r, 110)); // refills at least 1 token
assert.equal(bucket.tryConsume(1), true);
console.log("PASS");
`,
    reference: {
      "limiter.js": `export class TokenBucket {
  constructor(capacity, refillRatePerSec) {
    this.capacity = capacity;
    this.refillRate = refillRatePerSec;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  _refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
  tryConsume(tokens = 1) {
    this._refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }
}
`
    }
  },
  {
    id: "feature-09-query-string",
    bucket: "feature",
    prompt: "In query.js, implement export function stringify(obj) and export function parse(str). stringify converts an object of string/number values to URL query string (without leading '?'). parse converts a query string (with or without leading '?') to an object. Keys and values must be properly URI decoded/encoded.",
    fixture: {
      "query.js": `export function stringify(obj) { return ""; }
export function parse(str) { return {}; }
`
    },
    check: `const { stringify, parse } = await import(pathToFileURL(resolve(workdir, "query.js")).href);
const q = stringify({ search: "hello world", page: 2 });
assert.equal(q, "search=hello%20world&page=2");
const p = parse("?search=hello%20world&page=2");
assert.deepEqual(p, { search: "hello world", page: "2" });
assert.deepEqual(parse(""), {});
console.log("PASS");
`,
    reference: {
      "query.js": `export function stringify(obj) {
  return Object.entries(obj)
    .map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v))
    .join("&");
}
export function parse(str) {
  if (!str) return {};
  const cleaned = str.startsWith("?") ? str.slice(1) : str;
  if (!cleaned) return {};
  const res = {};
  for (const part of cleaned.split("&")) {
    const [k, v] = part.split("=");
    if (k) res[decodeURIComponent(k)] = v !== undefined ? decodeURIComponent(v) : "";
  }
  return res;
}
`
    }
  },
  {
    id: "feature-10-tree-traversal",
    bucket: "feature",
    prompt: "In tree.js, implement export function findNode(root, predicate) returning the first node matching predicate(node) or null, and export function collectValues(root) returning an array of node.val in depth-first preorder. Node structure: { val, children: [...] }.",
    fixture: {
      "tree.js": `export function findNode() { return null; }
export function collectValues() { return []; }
`
    },
    check: `const { findNode, collectValues } = await import(pathToFileURL(resolve(workdir, "tree.js")).href);
const tree = {
  val: "root",
  children: [
    { val: "a", children: [{ val: "a1", children: [] }] },
    { val: "b", children: [] }
  ]
};

assert.deepEqual(collectValues(tree), ["root", "a", "a1", "b"]);
const found = findNode(tree, (n) => n.val === "a1");
assert.equal(found?.val, "a1");
assert.equal(findNode(tree, (n) => n.val === "missing"), null);
console.log("PASS");
`,
    reference: {
      "tree.js": `export function findNode(root, predicate) {
  if (!root) return null;
  if (predicate(root)) return root;
  for (const child of root.children || []) {
    const res = findNode(child, predicate);
    if (res) return res;
  }
  return null;
}
export function collectValues(root) {
  if (!root) return [];
  const res = [root.val];
  for (const child of root.children || []) {
    res.push(...collectValues(child));
  }
  return res;
}
`
    }
  },

  // ==========================================
  // BUGFIX TASKS (10)
  // ==========================================
  {
    id: "bugfix-01-off-by-one",
    bucket: "bugfix",
    prompt: "Fix the bug in range.js. Run node test.js to see the failure. Do not alter test.js.",
    fixture: {
      "range.js": `export function range(start, end) {
  const res = [];
  for (let i = start; i < end; i++) {
    res.push(i);
  }
  return res;
}
`,
      "test.js": `import { range } from "./range.js";
import assert from "node:assert/strict";

const nums = range(1, 5);
assert.deepEqual(nums, [1, 2, 3, 4, 5]);
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
execSync("node test.js", { stdio: "inherit" });
`,
    reference: {
      "range.js": `export function range(start, end) {
  const res = [];
  for (let i = start; i <= end; i++) {
    res.push(i);
  }
  return res;
}
`
    }
  },
  {
    id: "bugfix-02-null-reference",
    bucket: "bugfix",
    prompt: "Fix the TypeError in getNested.js when accessing properties through null or undefined values. Run node test.js to reproduce.",
    fixture: {
      "getNested.js": `export function getNested(obj, path) {
  return path.split(".").reduce((acc, part) => acc[part], obj);
}
`,
      "test.js": `import { getNested } from "./getNested.js";
import assert from "node:assert/strict";

assert.equal(getNested({ a: { b: 42 } }, "a.b"), 42);
assert.equal(getNested({ a: null }, "a.b"), undefined);
assert.equal(getNested(null, "a.b"), undefined);
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
execSync("node test.js", { stdio: "inherit" });
`,
    reference: {
      "getNested.js": `export function getNested(obj, path) {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}
`
    }
  },
  {
    id: "bugfix-03-async-unhandled",
    bucket: "bugfix",
    prompt: "Fix fetchUserData in fetchUser.js so it properly awaits the fetcher and returns { error: err.message } on failure instead of throwing unhandled errors. Run node test.js.",
    fixture: {
      "fetchUser.js": `export async function fetchUserData(fetcher) {
  fetcher();
  return { status: "ok" };
}
`,
      "test.js": `import { fetchUserData } from "./fetchUser.js";
import assert from "node:assert/strict";

const ok = await fetchUserData(async () => "data");
assert.equal(ok.status, "ok");

const fail = await fetchUserData(async () => {
  throw new Error("network timeout");
});
assert.equal(fail.error, "network timeout");
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
execSync("node test.js", { stdio: "inherit" });
`,
    reference: {
      "fetchUser.js": `export async function fetchUserData(fetcher) {
  try {
    const data = await fetcher();
    return { status: "ok", data };
  } catch (err) {
    return { error: err.message };
  }
}
`
    }
  },
  {
    id: "bugfix-04-array-mutation",
    bucket: "bugfix",
    prompt: "Fix sortUsers in sorter.js so it returns a sorted copy of the array without mutating the input array. Run node test.js.",
    fixture: {
      "sorter.js": `export function sortUsers(users) {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}
`,
      "test.js": `import { sortUsers } from "./sorter.js";
import assert from "node:assert/strict";

const original = [{ name: "Charlie" }, { name: "Alice" }, { name: "Bob" }];
const sorted = sortUsers(original);

assert.equal(sorted[0].name, "Alice");
assert.equal(original[0].name, "Charlie", "Input array must not be mutated");
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
execSync("node test.js", { stdio: "inherit" });
`,
    reference: {
      "sorter.js": `export function sortUsers(users) {
  return [...users].sort((a, b) => a.name.localeCompare(b.name));
}
`
    }
  },
  {
    id: "bugfix-05-date-timezone",
    bucket: "bugfix",
    prompt: "Fix formatISODate in formatter.js to format in UTC YYYY-MM-DD regardless of local timezone. Run node test.js.",
    fixture: {
      "formatter.js": `export function formatISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return \`\${y}-\${m}-\${d}\`;
}
`,
      "test.js": `import { formatISODate } from "./formatter.js";
import assert from "node:assert/strict";

// 2026-05-01T00:30:00Z should always format as 2026-05-01 in UTC
const d = new Date("2026-05-01T00:30:00Z");
assert.equal(formatISODate(d), "2026-05-01");
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
// Force timezone that diverges from UTC to expose local timezone bug
execSync("node test.js", { stdio: "inherit", env: { ...process.env, TZ: "America/New_York" } });
`,
    reference: {
      "formatter.js": `export function formatISODate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return \`\${y}-\${m}-\${d}\`;
}
`
    }
  },
  {
    id: "bugfix-06-json-parse-crash",
    bucket: "bugfix",
    prompt: "Fix loadConfig(jsonStr, defaultConfig) in config.js so invalid JSON safely returns defaultConfig without crashing. Run node test.js.",
    fixture: {
      "config.js": `export function loadConfig(jsonStr, defaultConfig) {
  return JSON.parse(jsonStr);
}
`,
      "test.js": `import { loadConfig } from "./config.js";
import assert from "node:assert/strict";

const valid = loadConfig('{"port": 8080}', { port: 3000 });
assert.equal(valid.port, 8080);

const fallback = loadConfig('{ broken json...', { port: 3000 });
assert.equal(fallback.port, 3000);
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
execSync("node test.js", { stdio: "inherit" });
`,
    reference: {
      "config.js": `export function loadConfig(jsonStr, defaultConfig) {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return defaultConfig;
  }
}
`
    }
  },
  {
    id: "bugfix-07-regex-redos",
    bucket: "bugfix",
    prompt: "Fix email validation in validator.js so tags with '+' (like user+tag@example.com) are recognized as valid. Run node test.js.",
    fixture: {
      "validator.js": `export function isValidEmail(email) {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}
`,
      "test.js": `import { isValidEmail } from "./validator.js";
import assert from "node:assert/strict";

assert.equal(isValidEmail("user+tag@example.com"), true);
assert.equal(isValidEmail("normal.user@sub.domain.org"), true);
assert.equal(isValidEmail("not-an-email"), false);
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
execSync("node test.js", { stdio: "inherit" });
`,
    reference: {
      "validator.js": `export function isValidEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}
`
    }
  },
  {
    id: "bugfix-08-floating-point",
    bucket: "bugfix",
    prompt: "Fix addCurrency in money.js so precision issues like 0.1 + 0.2 are avoided and results round properly to 2 decimal places. Run node test.js.",
    fixture: {
      "money.js": `export function addCurrency(a, b) {
  return a + b;
}
`,
      "test.js": `import { addCurrency } from "./money.js";
import assert from "node:assert/strict";

assert.equal(addCurrency(0.1, 0.2), 0.3);
assert.equal(addCurrency(10.255, 0.005), 10.26);
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
execSync("node test.js", { stdio: "inherit" });
`,
    reference: {
      "money.js": `export function addCurrency(a, b) {
  return Math.round((a + b) * 100) / 100;
}
`
    }
  },
  {
    id: "bugfix-09-prototype-pollution",
    bucket: "bugfix",
    prompt: "Fix security vulnerability in extend.js preventing __proto__ and constructor property injection during recursive object extension. Run node test.js.",
    fixture: {
      "extend.js": `export function deepExtend(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepExtend(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
`,
      "test.js": `import { deepExtend } from "./extend.js";
import assert from "node:assert/strict";

const payload = JSON.parse('{"__proto__": {"polluted": true}}');
const obj = {};
deepExtend(obj, payload);

assert.equal({}.polluted, undefined, "Object prototype must not be polluted");
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
execSync("node test.js", { stdio: "inherit" });
`,
    reference: {
      "extend.js": `export function deepExtend(target, source) {
  for (const key of Object.keys(source)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepExtend(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
`
    }
  },
  {
    id: "bugfix-10-event-leak",
    bucket: "bugfix",
    prompt: "Fix tracker.js so unsubscribe() removes the exact listener specified, avoiding duplicate or lingering executions. Run node test.js.",
    fixture: {
      "tracker.js": `export class Tracker {
  constructor() {
    this.listeners = [];
  }
  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      // Bug: pops the last listener instead of removing fn!
      this.listeners.pop();
    };
  }
  notify(val) {
    for (const fn of this.listeners) fn(val);
  }
}
`,
      "test.js": `import { Tracker } from "./tracker.js";
import assert from "node:assert/strict";

const t = new Tracker();
let calledA = 0;
let calledB = 0;
const unsubA = t.subscribe(() => { calledA++; });
const unsubB = t.subscribe(() => { calledB++; });

unsubA(); // Unsubscribing A should leave B active
t.notify(1);

assert.equal(calledA, 0, "A should not have been called");
assert.equal(calledB, 1, "B should have been called once");
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
execSync("node test.js", { stdio: "inherit" });
`,
    reference: {
      "tracker.js": `export class Tracker {
  constructor() {
    this.listeners = [];
  }
  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      const idx = this.listeners.indexOf(fn);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }
  notify(val) {
    for (const fn of this.listeners) fn(val);
  }
}
`
    }
  },

  // ==========================================
  // REFACTOR TASKS (10)
  // ==========================================
  {
    id: "refactor-01-extract-helper",
    bucket: "refactor",
    prompt: "Refactor report.js by extracting duplicated formatting logic into helper functions. Reduce total lines of report.js to 45 lines or fewer. Tests in test.js must still pass.",
    fixture: {
      "report.js": `export function generateUserReport(user) {
  // Line padding and repetition
  const nameStr = user.name ? user.name.trim().toUpperCase() : "ANONYMOUS";
  const balanceStr = "$" + (Math.round(user.balance * 100) / 100).toFixed(2);
  const createdStr = user.createdAt ? new Date(user.createdAt).toISOString().split("T")[0] : "N/A";

  const summary = "USER: " + nameStr + " | BALANCE: " + balanceStr + " | SINCE: " + createdStr;

  const invoice1 = "Invoice 1 for " + nameStr + ": " + balanceStr + " generated on " + createdStr;
  const invoice2 = "Invoice 2 for " + nameStr + ": " + balanceStr + " due on " + createdStr;
  const receipt = "Receipt for " + nameStr + ": Total paid " + balanceStr + " at " + createdStr;
  const logEntry = "[" + createdStr + "] " + nameStr + " audited with " + balanceStr;

  // Extra repetitive lines to exceed 50 lines
  const lineA = "Audit A: " + nameStr + " - " + balanceStr;
  const lineB = "Audit B: " + nameStr + " - " + balanceStr;
  const lineC = "Audit C: " + nameStr + " - " + balanceStr;
  const lineD = "Audit D: " + nameStr + " - " + balanceStr;
  const lineE = "Audit E: " + nameStr + " - " + balanceStr;
  const lineF = "Audit F: " + nameStr + " - " + balanceStr;
  const lineG = "Audit G: " + nameStr + " - " + balanceStr;
  const lineH = "Audit H: " + nameStr + " - " + balanceStr;
  const lineI = "Audit I: " + nameStr + " - " + balanceStr;
  const lineJ = "Audit J: " + nameStr + " - " + balanceStr;
  const lineK = "Audit K: " + nameStr + " - " + balanceStr;
  const lineL = "Audit L: " + nameStr + " - " + balanceStr;
  const lineM = "Audit M: " + nameStr + " - " + balanceStr;
  const lineN = "Audit N: " + nameStr + " - " + balanceStr;
  const lineO = "Audit O: " + nameStr + " - " + balanceStr;
  const lineP = "Audit P: " + nameStr + " - " + balanceStr;
  const lineQ = "Audit Q: " + nameStr + " - " + balanceStr;
  const lineR = "Audit R: " + nameStr + " - " + balanceStr;
  const lineS = "Audit S: " + nameStr + " - " + balanceStr;
  const lineT = "Audit T: " + nameStr + " - " + balanceStr;
  const lineU = "Audit U: " + nameStr + " - " + balanceStr;
  const lineV = "Audit V: " + nameStr + " - " + balanceStr;

  return {
    summary,
    invoice1,
    invoice2,
    receipt,
    logEntry,
    auditTotal: 22
  };
}
`,
      "test.js": `import { generateUserReport } from "./report.js";
import assert from "node:assert/strict";

const r = generateUserReport({ name: "alice", balance: 50.5, createdAt: "2026-01-15T12:00:00Z" });
assert.equal(r.summary, "USER: ALICE | BALANCE: $50.50 | SINCE: 2026-01-15");
assert.equal(r.auditTotal, 22);
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const lines = readFileSync("report.js", "utf8").trim().split("\\n").length;
assert.ok(lines <= 45, \`Expected report.js <= 45 lines, got \${lines}\`);
`,
    reference: {
      "report.js": `function fmtUser(u) {
  const n = u.name ? u.name.trim().toUpperCase() : "ANONYMOUS";
  const b = "$" + (Math.round(u.balance * 100) / 100).toFixed(2);
  const d = u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : "N/A";
  return { n, b, d };
}

export function generateUserReport(user) {
  const { n, b, d } = fmtUser(user);
  return {
    summary: \`USER: \${n} | BALANCE: \${b} | SINCE: \${d}\`,
    invoice1: \`Invoice 1 for \${n}: \${b} generated on \${d}\`,
    invoice2: \`Invoice 2 for \${n}: \${b} due on \${d}\`,
    receipt: \`Receipt for \${n}: Total paid \${b} at \${d}\`,
    logEntry: \`[\${d}] \${n} audited with \${b}\`,
    auditTotal: 22
  };
}
`
    }
  },
  {
    id: "refactor-02-flatten-nesting",
    bucket: "refactor",
    prompt: "Refactor processOrder in processOrder.js using early return guard clauses to eliminate nested if-else statements. No line inside the function should have more than 2 indentation levels (8 spaces). node test.js must still pass.",
    fixture: {
      "processOrder.js": `export function processOrder(order) {
  if (order) {
    if (order.id) {
      if (order.items && order.items.length > 0) {
        if (order.paid) {
          return "PROCESSED";
        } else {
          return "UNPAID";
        }
      } else {
        return "EMPTY";
      }
    } else {
      return "INVALID_ID";
    }
  } else {
    return "NO_ORDER";
  }
}
`,
      "test.js": `import { processOrder } from "./processOrder.js";
import assert from "node:assert/strict";

assert.equal(processOrder(null), "NO_ORDER");
assert.equal(processOrder({}), "INVALID_ID");
assert.equal(processOrder({ id: 1 }), "EMPTY");
assert.equal(processOrder({ id: 1, items: [1] }), "UNPAID");
assert.equal(processOrder({ id: 1, items: [1], paid: true }), "PROCESSED");
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const content = readFileSync("processOrder.js", "utf8");
const lines = content.split("\\n");
for (const line of lines) {
  if (line.trim().length === 0) continue;
  const match = line.match(/^(\\s+)/);
  const indent = match ? match[1].length : 0;
  assert.ok(indent <= 8, \`Line exceeded max indent of 8 spaces: "\${line}"\`);
}
`,
    reference: {
      "processOrder.js": `export function processOrder(order) {
  if (!order) return "NO_ORDER";
  if (!order.id) return "INVALID_ID";
  if (!order.items || order.items.length === 0) return "EMPTY";
  if (!order.paid) return "UNPAID";
  return "PROCESSED";
}
`
    }
  },
  {
    id: "refactor-03-replace-switch",
    bucket: "refactor",
    prompt: "Refactor calculator.js to replace the switch statement with an operations lookup dictionary/map. The switch keyword must not appear in calculator.js. node test.js must still pass.",
    fixture: {
      "calculator.js": `export function calculate(op, a, b) {
  switch (op) {
    case "add":
      return a + b;
    case "sub":
      return a - b;
    case "mul":
      return a * b;
    case "div":
      return b === 0 ? null : a / b;
    default:
      throw new Error("Unknown op: " + op);
  }
}
`,
      "test.js": `import { calculate } from "./calculator.js";
import assert from "node:assert/strict";

assert.equal(calculate("add", 2, 3), 5);
assert.equal(calculate("sub", 10, 4), 6);
assert.equal(calculate("mul", 3, 3), 9);
assert.equal(calculate("div", 8, 2), 4);
assert.equal(calculate("div", 8, 0), null);
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const content = readFileSync("calculator.js", "utf8");
assert.ok(!content.includes("switch"), "calculator.js must not contain 'switch'");
`,
    reference: {
      "calculator.js": `const OPS = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => a * b,
  div: (a, b) => b === 0 ? null : a / b
};

export function calculate(op, a, b) {
  const fn = OPS[op];
  if (!fn) throw new Error("Unknown op: " + op);
  return fn(a, b);
}
`
    }
  },
  {
    id: "refactor-04-simplify-boolean",
    bucket: "refactor",
    prompt: "Simplify boolean logic in permissions.js. Remove redundant === true checks and ternary/if-else returns. Reduce lines to 20 or fewer. node test.js must pass.",
    fixture: {
      "permissions.js": `export function canAccess(user, resource) {
  if (user === null || user === undefined) {
    return false;
  }
  if (user.isAdmin === true) {
    return true;
  }
  if (user.isActive === true) {
    if (resource.isPublic === true) {
      return true;
    } else {
      if (user.id === resource.ownerId) {
        return true;
      } else {
        return false;
      }
    }
  } else {
    return false;
  }
}
`,
      "test.js": `import { canAccess } from "./permissions.js";
import assert from "node:assert/strict";

assert.equal(canAccess(null, {}), false);
assert.equal(canAccess({ isAdmin: true }, {}), true);
assert.equal(canAccess({ isActive: true, id: 1 }, { isPublic: true, ownerId: 2 }), true);
assert.equal(canAccess({ isActive: true, id: 1 }, { isPublic: false, ownerId: 1 }), true);
assert.equal(canAccess({ isActive: true, id: 1 }, { isPublic: false, ownerId: 2 }), false);
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const lines = readFileSync("permissions.js", "utf8").trim().split("\\n").length;
assert.ok(lines <= 20, \`Expected <= 20 lines, got \${lines}\`);
`,
    reference: {
      "permissions.js": `export function canAccess(user, resource) {
  if (!user) return false;
  if (user.isAdmin) return true;
  return Boolean(user.isActive && (resource?.isPublic || user.id === resource?.ownerId));
}
`
    }
  },
  {
    id: "refactor-05-remove-dead-code",
    bucket: "refactor",
    prompt: "Remove dead exports oldTrack, legacyFormat, and v1Payload from analytics.js. Keep active exports track and flush. node test.js must pass.",
    fixture: {
      "analytics.js": `export function oldTrack(event) {
  return "v1:" + event;
}

export function legacyFormat(data) {
  return JSON.stringify({ legacy: data });
}

export function v1Payload(id) {
  return { id, v: 1 };
}

export function track(event, data = {}) {
  return { event, data, timestamp: Date.now() };
}

export function flush() {
  return true;
}
`,
      "test.js": `import { track, flush } from "./analytics.js";
import assert from "node:assert/strict";

assert.equal(track("click").event, "click");
assert.equal(flush(), true);
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const content = readFileSync("analytics.js", "utf8");
assert.ok(!content.includes("oldTrack"), "must not contain oldTrack");
assert.ok(!content.includes("legacyFormat"), "must not contain legacyFormat");
assert.ok(!content.includes("v1Payload"), "must not contain v1Payload");
`,
    reference: {
      "analytics.js": `export function track(event, data = {}) {
  return { event, data, timestamp: Date.now() };
}

export function flush() {
  return true;
}
`
    }
  },
  {
    id: "refactor-06-class-to-functions",
    bucket: "refactor",
    prompt: "Refactor mathUtils.js from a class with static methods into exported pure functions add, multiply, and clamp. The class keyword must no longer appear in mathUtils.js. node test.js must pass.",
    fixture: {
      "mathUtils.js": `export class MathUtils {
  static add(a, b) {
    return a + b;
  }
  static multiply(a, b) {
    return a * b;
  }
  static clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }
}
`,
      "test.js": `import * as mod from "./mathUtils.js";
import assert from "node:assert/strict";

// Supports both namespace/named function imports
const add = mod.add || mod.MathUtils?.add;
const multiply = mod.multiply || mod.MathUtils?.multiply;
const clamp = mod.clamp || mod.MathUtils?.clamp;

assert.equal(add(2, 3), 5);
assert.equal(multiply(4, 5), 20);
assert.equal(clamp(15, 0, 10), 10);
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const content = readFileSync("mathUtils.js", "utf8");
assert.ok(!content.includes("class "), "mathUtils.js must not contain 'class '");
`,
    reference: {
      "mathUtils.js": `export function add(a, b) {
  return a + b;
}
export function multiply(a, b) {
  return a * b;
}
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}
`
    }
  },
  {
    id: "refactor-07-async-await",
    bucket: "refactor",
    prompt: "Refactor runPipeline in pipeline.js to use async/await syntax instead of .then() callbacks. The word .then must not appear. node test.js must pass.",
    fixture: {
      "pipeline.js": `export function runPipeline(fetchItem, processItem) {
  return fetchItem().then((item) => {
    return processItem(item).then((res) => {
      return { success: true, result: res };
    });
  });
}
`,
      "test.js": `import { runPipeline } from "./pipeline.js";
import assert from "node:assert/strict";

const res = await runPipeline(
  async () => "raw_item",
  async (item) => item.toUpperCase()
);
assert.deepEqual(res, { success: true, result: "RAW_ITEM" });
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const content = readFileSync("pipeline.js", "utf8");
assert.ok(!content.includes(".then"), "pipeline.js must not contain '.then'");
`,
    reference: {
      "pipeline.js": `export async function runPipeline(fetchItem, processItem) {
  const item = await fetchItem();
  const result = await processItem(item);
  return { success: true, result };
}
`
    }
  },
  {
    id: "refactor-08-decompose-function",
    bucket: "refactor",
    prompt: "Decompose buildSummary in buildSummary.js into three separate internal helper functions: parseData, computeMetrics, and formatReport. Keep buildSummary as the main export. node test.js must pass.",
    fixture: {
      "buildSummary.js": `export function buildSummary(rawInput) {
  // Parsing
  const lines = rawInput.trim().split("\\n");
  const entries = [];
  for (const l of lines) {
    const [k, v] = l.split(":");
    if (k && v) entries.push({ k: k.trim(), v: Number(v.trim()) });
  }

  // Computing
  let total = 0;
  for (const e of entries) total += e.v;
  const avg = entries.length ? total / entries.length : 0;

  // Formatting
  return "Summary: " + entries.length + " items, Total=" + total + ", Avg=" + avg;
}
`,
      "test.js": `import { buildSummary } from "./buildSummary.js";
import assert from "node:assert/strict";

const out = buildSummary("apple: 10\\nbanana: 20");
assert.equal(out, "Summary: 2 items, Total=30, Avg=15");
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const content = readFileSync("buildSummary.js", "utf8");
assert.ok(content.includes("parseData"), "must define parseData");
assert.ok(content.includes("computeMetrics"), "must define computeMetrics");
assert.ok(content.includes("formatReport"), "must define formatReport");
`,
    reference: {
      "buildSummary.js": `function parseData(raw) {
  return raw.trim().split("\\n").map(l => {
    const [k, v] = l.split(":");
    return { k: k?.trim(), v: Number(v?.trim() || 0) };
  }).filter(e => e.k);
}

function computeMetrics(entries) {
  const total = entries.reduce((s, e) => s + e.v, 0);
  const avg = entries.length ? total / entries.length : 0;
  return { count: entries.length, total, avg };
}

function formatReport({ count, total, avg }) {
  return \`Summary: \${count} items, Total=\${total}, Avg=\${avg}\`;
}

export function buildSummary(rawInput) {
  const entries = parseData(rawInput);
  const metrics = computeMetrics(entries);
  return formatReport(metrics);
}
`
    }
  },
  {
    id: "refactor-09-magic-numbers",
    bucket: "refactor",
    prompt: "Refactor pricing.js by extracting inline magic numbers (tax rate 0.0825, discount threshold 100, discount rate 0.05, shipping fee 15) into named const constants TAX_RATE, DISCOUNT_THRESHOLD, DISCOUNT_RATE, and SHIPPING_FEE at top of file. node test.js must pass.",
    fixture: {
      "pricing.js": `export function calculateTotal(subtotal) {
  let discount = 0;
  if (subtotal > 100) {
    discount = subtotal * 0.05;
  }
  const tax = (subtotal - discount) * 0.0825;
  const shipping = 15;
  return subtotal - discount + tax + shipping;
}
`,
      "test.js": `import { calculateTotal } from "./pricing.js";
import assert from "node:assert/strict";

const total = calculateTotal(200);
assert.equal(Math.round(total * 100) / 100, 220.68);
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const content = readFileSync("pricing.js", "utf8");
assert.ok(content.includes("TAX_RATE"), "must define TAX_RATE");
assert.ok(content.includes("DISCOUNT_THRESHOLD"), "must define DISCOUNT_THRESHOLD");
assert.ok(content.includes("DISCOUNT_RATE"), "must define DISCOUNT_RATE");
assert.ok(content.includes("SHIPPING_FEE"), "must define SHIPPING_FEE");
`,
    reference: {
      "pricing.js": `const TAX_RATE = 0.0825;
const DISCOUNT_THRESHOLD = 100;
const DISCOUNT_RATE = 0.05;
const SHIPPING_FEE = 15;

export function calculateTotal(subtotal) {
  let discount = 0;
  if (subtotal > DISCOUNT_THRESHOLD) {
    discount = subtotal * DISCOUNT_RATE;
  }
  const tax = (subtotal - discount) * TAX_RATE;
  return subtotal - discount + tax + SHIPPING_FEE;
}
`
    }
  },
  {
    id: "refactor-10-consolidate-duplicates",
    bucket: "refactor",
    prompt: "Consolidate repeated non-empty string validation in validatorRules.js by extracting a shared helper isNonEmptyString(val). Reduce line count by at least 15 lines (target <= 45 lines). node test.js must pass.",
    fixture: {
      "validatorRules.js": `export function validateUsername(u) {
  if (typeof u !== "string" || u === null || u === undefined || u.trim().length === 0) {
    return false;
  }
  return u.length >= 3;
}

export function validateEmail(e) {
  if (typeof e !== "string" || e === null || e === undefined || e.trim().length === 0) {
    return false;
  }
  return e.includes("@");
}

export function validateTitle(t) {
  if (typeof t !== "string" || t === null || t === undefined || t.trim().length === 0) {
    return false;
  }
  return t.length <= 100;
}

export function validateBio(b) {
  if (typeof b !== "string" || b === null || b === undefined || b.trim().length === 0) {
    return false;
  }
  return b.length <= 500;
}

// Extra verbose lines
const v1 = 1;
const v2 = 2;
const v3 = 3;
const v4 = 4;
const v5 = 5;
const v6 = 6;
const v7 = 7;
const v8 = 8;
const v9 = 9;
const v10 = 10;
const v11 = 11;
const v12 = 12;
const v13 = 13;
const v14 = 14;
const v15 = 15;
const v16 = 16;
export const VERBOSE_TOTAL = v1 + v16;
`,
      "test.js": `import { validateUsername, validateEmail, validateTitle, validateBio } from "./validatorRules.js";
import assert from "node:assert/strict";

assert.equal(validateUsername("alice"), true);
assert.equal(validateUsername(""), false);
assert.equal(validateEmail("a@b.com"), true);
assert.equal(validateTitle("A title"), true);
assert.equal(validateBio("Bio text"), true);
console.log("PASS");
`
    },
    checkScript: `import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

execSync("node test.js", { stdio: "inherit" });
const content = readFileSync("validatorRules.js", "utf8");
assert.ok(content.includes("isNonEmptyString"), "must define isNonEmptyString");
const lines = content.trim().split("\\n").length;
assert.ok(lines <= 45, \`Expected <= 45 lines, got \${lines}\`);
`,
    reference: {
      "validatorRules.js": `function isNonEmptyString(val) {
  return typeof val === "string" && val.trim().length > 0;
}

export function validateUsername(u) {
  return isNonEmptyString(u) && u.length >= 3;
}

export function validateEmail(e) {
  return isNonEmptyString(e) && e.includes("@");
}

export function validateTitle(t) {
  return isNonEmptyString(t) && t.length <= 100;
}

export function validateBio(b) {
  return isNonEmptyString(b) && b.length <= 500;
}

export const VERBOSE_TOTAL = 17;
`
    }
  },

  // ==========================================
  // QA TASKS (10)
  // ==========================================
  {
    id: "qa-01-http-status",
    bucket: "qa",
    prompt: "What is the standard HTTP status code for 'I\\'m a teapot'? Output only the 3-digit number.",
    fixture: {
      "README.md": "# HTTP Specifications\\nReference document for status codes.\\n"
    },
    qaCheck: {
      pattern: "\\\\b418\\\\b",
      expected: "418"
    }
  },
  {
    id: "qa-02-git-rebase-command",
    bucket: "qa",
    prompt: "What git command aborts an in-progress merge? Output only the command.",
    fixture: {
      "README.md": "# Git Guide\\nCommon commands for merging and rebasing.\\n"
    },
    qaCheck: {
      pattern: "git\\\\s+merge\\\\s+--abort",
      expected: "git merge --abort"
    }
  },
  {
    id: "qa-03-node-event-loop",
    bucket: "qa",
    prompt: "In Node.js, which phase of the event loop executes setImmediate() callbacks? Name only the phase.",
    fixture: {
      "README.md": "# Node.js Event Loop\\nPhases: timers, pending callbacks, idle/prepare, poll, check, close.\\n"
    },
    qaCheck: {
      pattern: "\\\\bcheck\\\\b",
      expected: "check"
    }
  },
  {
    id: "qa-04-css-specificity",
    bucket: "qa",
    prompt: "In styles.css, which selector has the highest CSS specificity? Output only the selector string.",
    fixture: {
      "styles.css": `#nav .item { color: red; }
header ul.menu li a { color: blue; }
body div#content p.lead { color: green; }
`
    },
    qaCheck: {
      pattern: "body\\\\s+div#content\\\\s+p\\\\.lead",
      expected: "body div#content p.lead"
    }
  },
  {
    id: "qa-05-sql-aggregate",
    bucket: "qa",
    prompt: "What SQL clause is used to filter the result groups of an aggregate query? Output only the keyword.",
    fixture: {
      "schema.sql": "-- SQL Reference Schema\\nSELECT department, COUNT(*) FROM employees GROUP BY department;\\n"
    },
    qaCheck: {
      pattern: "\\\\bHAVING\\\\b",
      expected: "HAVING"
    }
  },
  {
    id: "qa-06-dockerfile-instruction",
    bucket: "qa",
    prompt: "In a multi-stage Dockerfile, what flag on the COPY instruction copies files from a previous build stage named 'builder'? Output only the flag and its value (e.g. --flag=val).",
    fixture: {
      "Dockerfile": `FROM node:22 AS builder
WORKDIR /app
COPY . .
RUN npm run build

FROM nginx:alpine
# Copy instruction goes here
`
    },
    qaCheck: {
      pattern: "--from=builder",
      expected: "--from=builder"
    }
  },
  {
    id: "qa-07-regex-matcher",
    bucket: "qa",
    prompt: "How many lines in data.txt contain a valid IPv4 address? Output only the integer count.",
    fixture: {
      "data.txt": `192.168.1.1
invalid.ip.here
10.0.0.1
999.999.999.999
172.16.254.1
localhost
127.0.0.1
8.8.8.8
abc.def.ghi.jkl
1.1.1.1
255.255.255.0
`
    },
    qaCheck: {
      pattern: "\\\\b7\\\\b",
      expected: "7"
    }
  },
  {
    id: "qa-08-pkg-version",
    bucket: "qa",
    prompt: "What is the declared version of zod in package.json? Output only the exact version string including any range prefix.",
    fixture: {
      "package.json": `{\\n  "name": "sample",\\n  "dependencies": {\\n    "zod": "^3.22.4"\\n  }\\n}\\n`
    },
    qaCheck: {
      pattern: "\\\\^3\\\\.22\\\\.4",
      expected: "^3.22.4"
    }
  },
  {
    id: "qa-09-linux-signal",
    bucket: "qa",
    prompt: "What integer signal number corresponds to SIGKILL on standard Linux x86_64? Output only the number.",
    fixture: {
      "README.md": "# Linux Signals\\nStandard signals and numeric identifiers.\\n"
    },
    qaCheck: {
      pattern: "\\\\b9\\\\b",
      expected: "9"
    }
  },
  {
    id: "qa-10-complexity-class",
    bucket: "qa",
    prompt: "What is the worst-case time complexity of the algorithm in search.js? Output in Big-O notation, e.g. O(something).",
    fixture: {
      "search.js": `export function binarySearch(arr, target) {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}
`
    },
    qaCheck: {
      pattern: "O\\\\(\\\\s*log\\\\s*n\\\\s*\\\\)",
      expected: "O(log n)"
    }
  }
];

export function generateAll(baseDir = ".") {
  for (const t of TASKS) {
    const taskDir = join(baseDir, "benchmarks", "tasks", t.bucket, t.id);
    const fixtureDir = join(taskDir, "fixture");
    const refDir = join(baseDir, "benchmarks", "reference", t.id);

    mkdirSync(fixtureDir, { recursive: true });
    mkdirSync(refDir, { recursive: true });

    // 1. task.json
    const taskJson = {
      id: t.id,
      bucket: t.bucket,
      prompt: t.prompt
    };
    writeFileSync(join(taskDir, "task.json"), JSON.stringify(taskJson, null, 2) + "\n");

    // 2. fixture files
    for (const [fname, content] of Object.entries(t.fixture)) {
      writeFileSync(join(fixtureDir, fname), content);
    }

    // 3. check.mjs
    let checkContent = "";
    if (t.bucket === "qa") {
      checkContent = [
        "// check.mjs for " + t.id,
        'import { readFileSync } from "node:fs";',
        'import assert from "node:assert/strict";',
        "",
        "const resultFilePath = process.argv[3];",
        "if (!resultFilePath) {",
        '  console.error("Missing result file argument");',
        "  process.exit(1);",
        "}",
        "",
        'const text = readFileSync(resultFilePath, "utf8");',
        'const regex = new RegExp("' + t.qaCheck.pattern + '", "i");',
        "if (!regex.test(text)) {",
        '  console.error("Failed: expected pattern /' + t.qaCheck.pattern + '/i in result: " + text);',
        "  process.exit(1);",
        "}",
        'console.log("PASS");',
        "process.exit(0);",
        ""
      ].join("\n");
    } else if (t.checkScript) {
      checkContent = [
        "// check.mjs for " + t.id,
        'import { join } from "node:path";',
        'import { chdir } from "node:process";',
        "",
        "const workdir = process.argv[2] || process.cwd();",
        "chdir(workdir);",
        "",
        t.checkScript
      ].join("\n");
    } else if (t.check) {
      checkContent = [
        "// check.mjs for " + t.id,
        'import { join, resolve } from "node:path";',
        'import { pathToFileURL } from "node:url";',
        'import { chdir } from "node:process";',
        'import assert from "node:assert/strict";',
        "",
        "const workdir = process.argv[2] || process.cwd();",
        "chdir(workdir);",
        "",
        t.check
      ].join("\n");
    }
    writeFileSync(join(taskDir, "check.mjs"), checkContent);

    // 4. Reference solution
    if (t.bucket === "qa") {
      writeFileSync(join(refDir, "answer.txt"), t.qaCheck.expected + "\n");
    } else if (t.reference) {
      for (const [fname, content] of Object.entries(t.reference)) {
        writeFileSync(join(refDir, fname), content);
      }
    }
  }

  console.log("Successfully generated all " + TASKS.length + " tasks and reference solutions.");
}

generateAll();
