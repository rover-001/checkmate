import { runPipeline } from "./pipeline.js";
import assert from "node:assert/strict";

const res = await runPipeline(
  async () => "raw_item",
  async (item) => item.toUpperCase()
);
assert.deepEqual(res, { success: true, result: "RAW_ITEM" });
console.log("PASS");
