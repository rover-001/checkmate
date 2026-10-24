// benchmarks/stats.test.mjs — Unit tests for benchmark stats calculations
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  computeMedian,
  computeQuartiles,
  computeArmStats,
  computeSummary,
} from "./stats.mjs";

describe("computeMedian", () => {
  test("returns null for empty or invalid input", () => {
    assert.equal(computeMedian([]), null);
    assert.equal(computeMedian(null), null);
    assert.equal(computeMedian(undefined), null);
  });

  test("calculates median for single element", () => {
    assert.equal(computeMedian([42]), 42);
  });

  test("calculates median for odd number of elements (unsorted)", () => {
    assert.equal(computeMedian([9, 1, 5]), 5);
    assert.equal(computeMedian([7, 3, 1, 9, 5]), 5);
  });

  test("calculates median for even number of elements", () => {
    assert.equal(computeMedian([10, 20]), 15);
    assert.equal(computeMedian([1, 2, 3, 4]), 2.5);
    assert.equal(computeMedian([4, 1, 2, 3]), 2.5);
  });
});

describe("computeQuartiles", () => {
  test("returns null for < 2 elements", () => {
    assert.equal(computeQuartiles([]), null);
    assert.equal(computeQuartiles([10]), null);
  });

  test("calculates quartiles for 2 elements", () => {
    assert.deepEqual(computeQuartiles([10, 20]), [10, 20]);
  });

  test("calculates quartiles for odd number of elements", () => {
    // [1, 2, 3, 4, 5] -> lower [1, 2] -> 1.5; upper [4, 5] -> 4.5
    assert.deepEqual(computeQuartiles([1, 2, 3, 4, 5]), [1.5, 4.5]);
  });

  test("calculates quartiles for even number of elements", () => {
    // [1, 2, 3, 4, 5, 6] -> lower [1, 2, 3] -> 2; upper [4, 5, 6] -> 5
    assert.deepEqual(computeQuartiles([6, 5, 4, 3, 2, 1]), [2, 5]);
  });
});

describe("computeArmStats", () => {
  test("returns all nulls and zero pass rate when no runs passed", () => {
    const runs = [
      { passed: false, outputTokens: 100, totalTokens: 1000, steps: 5, wallMs: 2000 },
      { passed: false, outputTokens: 200, totalTokens: 2000, steps: 10, wallMs: 4000 },
    ];
    const stats = computeArmStats(runs);
    assert.equal(stats.runs, 2);
    assert.equal(stats.passed, 0);
    assert.equal(stats.passRate, 0);
    assert.equal(stats.medianOutputTokens, null);
    assert.equal(stats.iqrOutputTokens, null);
    assert.equal(stats.medianTotalTokens, null);
    assert.equal(stats.medianSteps, null);
    assert.equal(stats.medianWallMs, null);
  });

  test("computes medians and IQR STRICTLY over passed runs, ignoring failed runs", () => {
    const runs = [
      // Failed runs have absurdly low or high tokens that must NOT affect medians
      { passed: false, outputTokens: 1, totalTokens: 1, steps: 1, wallMs: 1 },
      { passed: true, outputTokens: 100, totalTokens: 1000, steps: 2, wallMs: 1000 },
      { passed: true, outputTokens: 200, totalTokens: 2000, steps: 4, wallMs: 2000 },
      { passed: true, outputTokens: 300, totalTokens: 3000, steps: 6, wallMs: 3000 },
      { passed: false, outputTokens: 99999, totalTokens: 99999, steps: 99, wallMs: 99999 },
    ];

    const stats = computeArmStats(runs);
    assert.equal(stats.runs, 5);
    assert.equal(stats.passed, 3);
    assert.equal(stats.passRate, 0.6);

    // Passed outputTokens: [100, 200, 300] -> median: 200, lower: [100], upper: [300] -> IQR: [100, 300]
    assert.equal(stats.medianOutputTokens, 200);
    assert.deepEqual(stats.iqrOutputTokens, [100, 300]);
    assert.equal(stats.medianTotalTokens, 2000);
    assert.equal(stats.medianSteps, 4);
    assert.equal(stats.medianWallMs, 2000);
  });

  test("handles empty runs gracefully", () => {
    const stats = computeArmStats([]);
    assert.equal(stats.runs, 0);
    assert.equal(stats.passed, 0);
    assert.equal(stats.passRate, 0);
    assert.equal(stats.medianOutputTokens, null);
  });
});

describe("computeSummary", () => {
  test("generates exact schema required by shared contract", () => {
    const sampleRuns = [
      { bucket: "feature", arm: "baseline", passed: true, outputTokens: 150, totalTokens: 1200, steps: 2, wallMs: 1500 },
      { bucket: "feature", arm: "checkmate", passed: true, outputTokens: 90, totalTokens: 800, steps: 1, wallMs: 900 },
      { bucket: "qa", arm: "baseline", passed: true, outputTokens: 20, totalTokens: 400, steps: 1, wallMs: 500 },
      { bucket: "qa", arm: "checkmate", passed: true, outputTokens: 10, totalTokens: 300, steps: 1, wallMs: 400 },
    ];

    const summary = computeSummary({
      runs: sampleRuns,
      model: "haiku",
      runsPerTask: 1,
      armNames: ["baseline", "checkmate"],
      bucketNames: ["feature", "bugfix", "refactor", "qa"],
    });

    assert.ok(summary.generatedAt);
    assert.equal(summary.model, "haiku");
    assert.equal(summary.runsPerTask, 1);
    assert.ok(summary.arms.baseline);
    assert.ok(summary.arms.checkmate);
    assert.equal(summary.arms.baseline.runs, 2);
    assert.equal(summary.arms.baseline.passed, 2);
    assert.equal(summary.arms.checkmate.runs, 2);

    assert.ok(summary.buckets.feature.baseline);
    assert.ok(summary.buckets.feature.checkmate);
    assert.ok(summary.buckets.bugfix.baseline);
    assert.equal(summary.buckets.bugfix.baseline.runs, 0);
    assert.equal(summary.buckets.bugfix.baseline.passed, 0);
    assert.equal(summary.buckets.qa.baseline.runs, 1);
  });
});
