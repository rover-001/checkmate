// benchmarks/stats.test.mjs — Unit tests for benchmark stats calculations
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  computeMedian,
  computeQuartiles,
  computeArmStats,
  computeSummary,
  computeIntersectionStats,
  computePairedIntersection,
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
      { passed: false, inputTokens: 500, cacheReadTokens: 1000, outputTokens: 100, totalTokens: 1000, steps: 5, wallMs: 2000 },
      { passed: false, inputTokens: 600, cacheReadTokens: 2000, outputTokens: 200, totalTokens: 2000, steps: 10, wallMs: 4000 },
    ];
    const stats = computeArmStats(runs);
    assert.equal(stats.runs, 2);
    assert.equal(stats.passed, 0);
    assert.equal(stats.passRate, 0);
    assert.equal(stats.medianInputTokens, null);
    assert.equal(stats.iqrInputTokens, null);
    assert.equal(stats.medianCacheReadTokens, null);
    assert.equal(stats.iqrCacheReadTokens, null);
    assert.equal(stats.medianOutputTokens, null);
    assert.equal(stats.iqrOutputTokens, null);
    assert.equal(stats.medianTotalTokens, null);
    assert.equal(stats.medianSteps, null);
    assert.equal(stats.medianWallMs, null);
  });

  test("computes medians and IQR STRICTLY over passed runs, ignoring failed runs", () => {
    const runs = [
      // Failed runs have absurdly low or high tokens that must NOT affect medians
      { passed: false, inputTokens: 1, cacheReadTokens: 1, outputTokens: 1, totalTokens: 1, steps: 1, wallMs: 1 },
      { passed: true, inputTokens: 1000, cacheReadTokens: 5000, outputTokens: 100, totalTokens: 6100, steps: 2, wallMs: 1000 },
      { passed: true, inputTokens: 2000, cacheReadTokens: 10000, outputTokens: 200, totalTokens: 12200, steps: 4, wallMs: 2000 },
      { passed: true, inputTokens: 3000, cacheReadTokens: 15000, outputTokens: 300, totalTokens: 18300, steps: 6, wallMs: 3000 },
      { passed: false, inputTokens: 99999, cacheReadTokens: 99999, outputTokens: 99999, totalTokens: 99999, steps: 99, wallMs: 99999 },
    ];

    const stats = computeArmStats(runs);
    assert.equal(stats.runs, 5);
    assert.equal(stats.passed, 3);
    assert.equal(stats.passRate, 0.6);

    // Passed outputTokens: [100, 200, 300] -> median: 200, IQR: [100, 300]
    assert.equal(stats.medianOutputTokens, 200);
    assert.deepEqual(stats.iqrOutputTokens, [100, 300]);
    // Passed inputTokens: [1000, 2000, 3000] -> median: 2000, IQR: [1000, 3000]
    assert.equal(stats.medianInputTokens, 2000);
    assert.deepEqual(stats.iqrInputTokens, [1000, 3000]);
    // Passed cacheReadTokens: [5000, 10000, 15000] -> median: 10000, IQR: [5000, 15000]
    assert.equal(stats.medianCacheReadTokens, 10000);
    assert.deepEqual(stats.iqrCacheReadTokens, [5000, 15000]);

    assert.equal(stats.medianTotalTokens, 12200);
    assert.equal(stats.medianSteps, 4);
    assert.equal(stats.medianWallMs, 2000);
  });

  test("handles empty runs gracefully", () => {
    const stats = computeArmStats([]);
    assert.equal(stats.runs, 0);
    assert.equal(stats.passed, 0);
    assert.equal(stats.passRate, 0);
    assert.equal(stats.medianOutputTokens, null);
    assert.equal(stats.medianInputTokens, null);
    assert.equal(stats.medianCacheReadTokens, null);
  });
});

describe("computeIntersectionStats (Paired Intersection)", () => {
  test("computes medians strictly over taskIds where ALL evaluated arms passed every run", () => {
    const runs = [
      // Task 1: Both arms passed run 1 and run 2 -> QUALIFIED
      { taskId: "task-1", arm: "baseline", run: 1, passed: true, inputTokens: 1000, cacheReadTokens: 4000, outputTokens: 200, totalTokens: 5200, steps: 3, wallMs: 3000 },
      { taskId: "task-1", arm: "baseline", run: 2, passed: true, inputTokens: 1200, cacheReadTokens: 4200, outputTokens: 220, totalTokens: 5620, steps: 3, wallMs: 3200 },
      { taskId: "task-1", arm: "checkmate", run: 1, passed: true, inputTokens: 600, cacheReadTokens: 2000, outputTokens: 90, totalTokens: 2690, steps: 1, wallMs: 1200 },
      { taskId: "task-1", arm: "checkmate", run: 2, passed: true, inputTokens: 700, cacheReadTokens: 2100, outputTokens: 110, totalTokens: 2910, steps: 1, wallMs: 1400 },

      // Task 2: Baseline failed run 2, checkmate passed both -> DISQUALIFIED (survivorship bias elimination)
      { taskId: "task-2", arm: "baseline", run: 1, passed: true, inputTokens: 800, cacheReadTokens: 3000, outputTokens: 150, totalTokens: 3950, steps: 2, wallMs: 2000 },
      { taskId: "task-2", arm: "baseline", run: 2, passed: false, inputTokens: 900, cacheReadTokens: 3100, outputTokens: 160, totalTokens: 4160, steps: 2, wallMs: 2100 },
      { taskId: "task-2", arm: "checkmate", run: 1, passed: true, inputTokens: 500, cacheReadTokens: 1800, outputTokens: 80, totalTokens: 2380, steps: 1, wallMs: 1100 },
      { taskId: "task-2", arm: "checkmate", run: 2, passed: true, inputTokens: 550, cacheReadTokens: 1900, outputTokens: 85, totalTokens: 2535, steps: 1, wallMs: 1150 },

      // Task 3: Both arms passed run 1 and run 2 -> QUALIFIED
      { taskId: "task-3", arm: "baseline", run: 1, passed: true, inputTokens: 1500, cacheReadTokens: 6000, outputTokens: 300, totalTokens: 7800, steps: 4, wallMs: 4000 },
      { taskId: "task-3", arm: "baseline", run: 2, passed: true, inputTokens: 1700, cacheReadTokens: 6200, outputTokens: 320, totalTokens: 8220, steps: 4, wallMs: 4200 },
      { taskId: "task-3", arm: "checkmate", run: 1, passed: true, inputTokens: 800, cacheReadTokens: 2500, outputTokens: 120, totalTokens: 3420, steps: 2, wallMs: 1600 },
      { taskId: "task-3", arm: "checkmate", run: 2, passed: true, inputTokens: 900, cacheReadTokens: 2600, outputTokens: 140, totalTokens: 3640, steps: 2, wallMs: 1800 },
    ];

    const result = computeIntersectionStats(runs, ["baseline", "checkmate"]);

    assert.equal(result.taskCount, 2);
    assert.deepEqual(result.taskIds, ["task-1", "task-3"]);

    // Baseline intersection runs: task-1 (runs 1, 2) and task-3 (runs 1, 2) -> 4 runs
    const baseStats = result.arms.baseline;
    assert.equal(baseStats.runs, 4);
    assert.equal(baseStats.passed, 4);
    assert.equal(baseStats.passRate, 1.0);
    // Baseline outputTokens in intersection: [200, 220, 300, 320] -> median: 260
    assert.equal(baseStats.medianOutputTokens, 260);
    // Baseline inputTokens: [1000, 1200, 1500, 1700] -> median: 1350
    assert.equal(baseStats.medianInputTokens, 1350);
    // Baseline cacheReadTokens: [4000, 4200, 6000, 6200] -> median: 5100
    assert.equal(baseStats.medianCacheReadTokens, 5100);

    // Checkmate intersection runs: task-1 (runs 1, 2) and task-3 (runs 1, 2) -> 4 runs
    const cmStats = result.arms.checkmate;
    assert.equal(cmStats.runs, 4);
    assert.equal(cmStats.passed, 4);
    assert.equal(cmStats.passRate, 1.0);
    // Checkmate outputTokens in intersection: [90, 110, 120, 140] -> median: 115
    assert.equal(cmStats.medianOutputTokens, 115);
    // Checkmate inputTokens: [600, 700, 800, 900] -> median: 750
    assert.equal(cmStats.medianInputTokens, 750);
    // Checkmate cacheReadTokens: [2000, 2100, 2500, 2600] -> median: 2300
    assert.equal(cmStats.medianCacheReadTokens, 2300);
  });

  test("handles zero common tasks gracefully", () => {
    const runs = [
      { taskId: "task-1", arm: "baseline", run: 1, passed: true },
      { taskId: "task-1", arm: "checkmate", run: 1, passed: false },
      { taskId: "task-2", arm: "baseline", run: 1, passed: false },
      { taskId: "task-2", arm: "checkmate", run: 1, passed: true },
    ];
    const result = computeIntersectionStats(runs, ["baseline", "checkmate"]);
    assert.equal(result.taskCount, 0);
    assert.deepEqual(result.taskIds, []);
    assert.equal(result.arms.baseline.runs, 0);
    assert.equal(result.arms.checkmate.runs, 0);
  });

  test("computePairedIntersection is an alias of computeIntersectionStats", () => {
    assert.equal(computePairedIntersection, computeIntersectionStats);
  });
});

describe("computeSummary", () => {
  test("generates exact schema required by shared contract and includes intersection", () => {
    const sampleRuns = [
      { taskId: "task-a", bucket: "feature", arm: "baseline", run: 1, passed: true, inputTokens: 500, cacheReadTokens: 1000, outputTokens: 150, totalTokens: 1200, steps: 2, wallMs: 1500 },
      { taskId: "task-a", bucket: "feature", arm: "checkmate", run: 1, passed: true, inputTokens: 300, cacheReadTokens: 800, outputTokens: 90, totalTokens: 800, steps: 1, wallMs: 900 },
      { taskId: "task-b", bucket: "qa", arm: "baseline", run: 1, passed: true, inputTokens: 200, cacheReadTokens: 500, outputTokens: 20, totalTokens: 400, steps: 1, wallMs: 500 },
      { taskId: "task-b", bucket: "qa", arm: "checkmate", run: 1, passed: true, inputTokens: 150, cacheReadTokens: 400, outputTokens: 10, totalTokens: 300, steps: 1, wallMs: 400 },
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

    // Verify split token metrics on summary.arms
    assert.equal(summary.arms.baseline.medianInputTokens, 350);
    assert.equal(summary.arms.baseline.medianCacheReadTokens, 750);
    assert.equal(summary.arms.checkmate.medianInputTokens, 225);
    assert.equal(summary.arms.checkmate.medianCacheReadTokens, 600);

    // Verify intersection object on summary
    assert.ok(summary.intersection);
    assert.equal(summary.intersection.taskCount, 2);
    assert.deepEqual(summary.intersection.taskIds, ["task-a", "task-b"]);
    assert.ok(summary.intersection.arms.baseline);
    assert.ok(summary.intersection.arms.checkmate);

    assert.ok(summary.buckets.feature.baseline);
    assert.ok(summary.buckets.feature.checkmate);
    assert.ok(summary.buckets.bugfix.baseline);
    assert.equal(summary.buckets.bugfix.baseline.runs, 0);
    assert.equal(summary.buckets.bugfix.baseline.passed, 0);
    assert.equal(summary.buckets.qa.baseline.runs, 1);
  });
});
