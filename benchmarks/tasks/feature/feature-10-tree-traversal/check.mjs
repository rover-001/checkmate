// check.mjs for feature-10-tree-traversal
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chdir } from "node:process";
import assert from "node:assert/strict";

const workdir = process.argv[2] || process.cwd();
chdir(workdir);

const { findNode, collectValues } = await import(pathToFileURL(resolve(workdir, "tree.js")).href);
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
