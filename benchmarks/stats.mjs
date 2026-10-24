// benchmarks/stats.mjs — Statistical calculations for checkmate benchmarks
// Zero external dependencies. Node 22 ESM.

/**
 * Computes median of a numeric array.
 * Returns null if array is empty.
 * @param {number[]} numbers
 * @returns {number|null}
 */
export function computeMedian(numbers) {
  if (!numbers || numbers.length === 0) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Computes Q1 and Q3 (interquartile range) using Tukey's hinges.
 * Returns null if fewer than 2 elements.
 * @param {number[]} numbers
 * @returns {[number, number]|null}
 */
export function computeQuartiles(numbers) {
  if (!numbers || numbers.length < 2) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const n = sorted.length;
  const lowerHalf = sorted.slice(0, Math.floor(n / 2));
  const upperHalf = sorted.slice(Math.ceil(n / 2));

  const q1 = computeMedian(lowerHalf);
  const q3 = computeMedian(upperHalf);

  if (q1 === null || q3 === null) return null;
  return [q1, q3];
}

/**
 * Computes ARM statistics over runs.
 * Note: Medians and IQR are computed STRICTLY over passed runs.
 * @param {Array<{ passed: boolean, outputTokens?: number, totalTokens?: number, steps?: number, wallMs?: number }>} runs
 * @returns {{
 *   runs: number,
 *   passed: number,
 *   passRate: number,
 *   medianOutputTokens: number|null,
 *   iqrOutputTokens: [number, number]|null,
 *   medianTotalTokens: number|null,
 *   medianSteps: number|null,
 *   medianWallMs: number|null
 * }}
 */
export function computeArmStats(runs = []) {
  const totalRuns = runs.length;
  const passedRuns = runs.filter((r) => r.passed === true);
  const passed = passedRuns.length;
  const passRate = totalRuns > 0 ? Number((passed / totalRuns).toFixed(4)) : 0;

  if (passed === 0) {
    return {
      runs: totalRuns,
      passed: 0,
      passRate: 0,
      medianOutputTokens: null,
      iqrOutputTokens: null,
      medianTotalTokens: null,
      medianSteps: null,
      medianWallMs: null,
    };
  }

  const outputTokens = passedRuns
    .map((r) => r.outputTokens)
    .filter((v) => typeof v === "number");
  const totalTokens = passedRuns
    .map((r) => r.totalTokens)
    .filter((v) => typeof v === "number");
  const steps = passedRuns
    .map((r) => r.steps)
    .filter((v) => typeof v === "number");
  const wallMs = passedRuns
    .map((r) => r.wallMs)
    .filter((v) => typeof v === "number");

  return {
    runs: totalRuns,
    passed,
    passRate,
    medianOutputTokens: computeMedian(outputTokens),
    iqrOutputTokens: computeQuartiles(outputTokens),
    medianTotalTokens: computeMedian(totalTokens),
    medianSteps: computeMedian(steps),
    medianWallMs: computeMedian(wallMs),
  };
}

/**
 * Computes full summary object per shared contract schema.
 * @param {{
 *   runs: Array<{ bucket: string, arm: string, passed: boolean, outputTokens?: number, totalTokens?: number, steps?: number, wallMs?: number }>,
 *   model: string,
 *   runsPerTask: number,
 *   armNames?: string[],
 *   bucketNames?: string[],
 *   generatedAt?: string
 * }} options
 */
export function computeSummary({
  runs = [],
  model = "haiku",
  runsPerTask = 3,
  armNames = ["baseline", "checkmate"],
  bucketNames = ["feature", "bugfix", "refactor", "qa"],
  generatedAt = new Date().toISOString(),
}) {
  const arms = {};
  for (const arm of armNames) {
    const armRuns = runs.filter((r) => r.arm === arm);
    arms[arm] = computeArmStats(armRuns);
  }

  const buckets = {};
  for (const bucket of bucketNames) {
    buckets[bucket] = {};
    for (const arm of armNames) {
      const bucketArmRuns = runs.filter(
        (r) => r.bucket === bucket && r.arm === arm
      );
      buckets[bucket][arm] = computeArmStats(bucketArmRuns);
    }
  }

  return {
    generatedAt,
    model,
    runsPerTask,
    arms,
    buckets,
  };
}
