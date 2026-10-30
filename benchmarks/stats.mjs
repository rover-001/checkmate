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
 * @param {Array<{ passed: boolean, inputTokens?: number, cacheReadTokens?: number, outputTokens?: number, totalTokens?: number, steps?: number, wallMs?: number }>} runs
 * @returns {{
 *   runs: number,
 *   passed: number,
 *   passRate: number,
 *   medianInputTokens: number|null,
 *   iqrInputTokens: [number, number]|null,
 *   medianCacheReadTokens: number|null,
 *   iqrCacheReadTokens: [number, number]|null,
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
      medianInputTokens: null,
      iqrInputTokens: null,
      medianCacheReadTokens: null,
      iqrCacheReadTokens: null,
      medianOutputTokens: null,
      iqrOutputTokens: null,
      medianTotalTokens: null,
      medianSteps: null,
      medianWallMs: null,
    };
  }

  const inputTokens = passedRuns
    .map((r) => r.inputTokens)
    .filter((v) => typeof v === "number");
  const cacheReadTokens = passedRuns
    .map((r) => r.cacheReadTokens)
    .filter((v) => typeof v === "number");
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
    medianInputTokens: computeMedian(inputTokens),
    iqrInputTokens: computeQuartiles(inputTokens),
    medianCacheReadTokens: computeMedian(cacheReadTokens),
    iqrCacheReadTokens: computeQuartiles(cacheReadTokens),
    medianOutputTokens: computeMedian(outputTokens),
    iqrOutputTokens: computeQuartiles(outputTokens),
    medianTotalTokens: computeMedian(totalTokens),
    medianSteps: computeMedian(steps),
    medianWallMs: computeMedian(wallMs),
  };
}

/**
 * Computes paired intersection metrics strictly over tasks where ALL evaluated arms passed every run.
 * Eliminates survivorship bias by evaluating identical task difficulty profiles.
 *
 * @param {Array<object>|{ runs: Array<object>, armNames?: string[] }} runsOrOptions
 * @param {string[]} [maybeArmNames]
 * @returns {{
 *   taskCount: number,
 *   sharedTaskCount: number,
 *   taskIds: string[],
 *   sharedTaskIds: string[],
 *   arms: Record<string, ReturnType<typeof computeArmStats>>
 * }}
 */
export function computeIntersectionStats(runsOrOptions = [], maybeArmNames) {
  let runs = [];
  let armNames = null;

  if (Array.isArray(runsOrOptions)) {
    runs = runsOrOptions;
    if (Array.isArray(maybeArmNames)) {
      armNames = maybeArmNames;
    }
  } else if (runsOrOptions && typeof runsOrOptions === "object") {
    runs = runsOrOptions.runs || [];
    if (Array.isArray(runsOrOptions.armNames)) {
      armNames = runsOrOptions.armNames;
    }
  }

  if (!armNames || armNames.length === 0) {
    armNames = [...new Set(runs.map((r) => r.arm).filter(Boolean))];
  }

  // Group runs by taskId
  const tasksMap = new Map();
  for (const run of runs) {
    if (!run.taskId) continue;
    if (!tasksMap.has(run.taskId)) {
      tasksMap.set(run.taskId, []);
    }
    tasksMap.get(run.taskId).push(run);
  }

  // Find taskIds where ALL evaluated arms passed EVERY run
  const sharedTaskIds = [];
  for (const [taskId, taskRuns] of tasksMap.entries()) {
    let allArmsPassed = true;
    for (const arm of armNames) {
      const armRuns = taskRuns.filter((r) => r.arm === arm);
      if (armRuns.length === 0 || !armRuns.every((r) => r.passed === true)) {
        allArmsPassed = false;
        break;
      }
    }
    if (allArmsPassed) {
      sharedTaskIds.push(taskId);
    }
  }
  sharedTaskIds.sort();

  const arms = {};
  for (const arm of armNames) {
    const armIntersectionRuns = runs.filter(
      (r) => r.arm === arm && sharedTaskIds.includes(r.taskId)
    );
    arms[arm] = computeArmStats(armIntersectionRuns);
  }

  return {
    taskCount: sharedTaskIds.length,
    sharedTaskCount: sharedTaskIds.length,
    taskIds: sharedTaskIds,
    sharedTaskIds,
    arms,
  };
}

export const computePairedIntersection = computeIntersectionStats;

/**
 * Classifies a failed run into one of 5 categories:
 * - "skipped verification"
 * - "partial change"
 * - "wrong output"
 * - "timeout"
 * - "other"
 *
 * @param {{
 *   passed: boolean,
 *   error?: string,
 *   checkOutput?: string,
 *   agentOutput?: string,
 *   timedOut?: boolean,
 *   wallMs?: number,
 *   locPersisted?: number,
 *   bucket?: string,
 *   failureReason?: string
 * }} run
 * @returns {string|null}
 */
export function classifyFailure(run) {
  if (run.passed) return null;
  if (run.failureReason) return run.failureReason;

  const rawText = [
    run.error || "",
    run.checkOutput || "",
    run.agentOutput || "",
  ].join(" ").toLowerCase();

  // 1. Timeout
  if (
    run.timedOut ||
    run.wallMs >= 180000 ||
    rawText.includes("timed out") ||
    rawText.includes("timeout") ||
    rawText.includes("etimedout")
  ) {
    return "timeout";
  }

  // 2. Skipped verification (e.g. claimed done without running check, or check noted unverified)
  if (
    rawText.includes("unverified") ||
    rawText.includes("skipped verification") ||
    rawText.includes("verification skipped") ||
    rawText.includes("did not verify") ||
    rawText.includes("not verified")
  ) {
    return "skipped verification";
  }

  // 3. Partial change (missing requested helper/function, not implemented, incomplete, or untouched non-qa file)
  if (
    rawText.includes("not implemented") ||
    rawText.includes("partial change") ||
    rawText.includes("missing part") ||
    rawText.includes("incomplete") ||
    rawText.includes("is not a function") ||
    rawText.includes("is not exported") ||
    rawText.includes("must be exported") ||
    (run.locPersisted === 0 && run.bucket !== "qa")
  ) {
    return "partial change";
  }

  // 4. Wrong output (assertion mismatch, wrong return value, failed check)
  if (
    rawText.includes("assertionerror") ||
    rawText.includes("expected") ||
    rawText.includes("wrong") ||
    rawText.includes("mismatch") ||
    rawText.includes("verification failed") ||
    rawText.includes("failed check") ||
    rawText.includes("fail")
  ) {
    return "wrong output";
  }

  return "other";
}

/**
 * Computes failure breakdown table and failing task IDs per arm.
 * @param {Array<object>|{ runs: Array<object>, armNames?: string[] }} runsOrOptions
 * @param {string[]} [maybeArmNames]
 * @returns {Record<string, {
 *   runs: number,
 *   failed: number,
 *   categories: Record<string, number>,
 *   taskIds: string[]
 * }>}
 */
export function computeFailureBreakdown(runsOrOptions = [], maybeArmNames) {
  let runs = [];
  let armNames = null;

  if (Array.isArray(runsOrOptions)) {
    runs = runsOrOptions;
    if (Array.isArray(maybeArmNames)) armNames = maybeArmNames;
  } else if (runsOrOptions && typeof runsOrOptions === "object") {
    runs = runsOrOptions.runs || [];
    if (Array.isArray(runsOrOptions.armNames)) armNames = runsOrOptions.armNames;
  }

  if (!armNames || armNames.length === 0) {
    armNames = ["checkmate", "ultra"];
  }

  const breakdown = {};
  for (const arm of armNames) {
    const armRuns = runs.filter((r) => r.arm === arm);
    const failedRuns = armRuns.filter((r) => r.passed === false);
    const categories = {
      "skipped verification": 0,
      "partial change": 0,
      "wrong output": 0,
      "timeout": 0,
      "other": 0,
    };
    const failingTasks = new Set();

    for (const r of failedRuns) {
      const cat = classifyFailure(r) || "other";
      if (categories[cat] !== undefined) {
        categories[cat]++;
      } else {
        categories["other"]++;
      }
      if (r.taskId) failingTasks.add(r.taskId);
    }

    breakdown[arm] = {
      runs: armRuns.length,
      failed: failedRuns.length,
      categories,
      taskIds: [...failingTasks].sort(),
    };
  }

  return breakdown;
}

/**
 * Computes full summary object per shared contract schema.
 * @param {{
 *   runs: Array<{ taskId?: string, bucket: string, arm: string, passed: boolean, inputTokens?: number, cacheReadTokens?: number, outputTokens?: number, totalTokens?: number, steps?: number, wallMs?: number }>,
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
  bucketNames = ["feature", "bugfix", "refactor", "qa", "integrate"],
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

  const intersection = computeIntersectionStats({ runs, armNames });

  const targetFailureArms = armNames.filter(
    (a) => a === "checkmate" || a === "ultra" || a.includes("checkmate") || a.includes("ultra")
  );
  const failureArms = targetFailureArms.length > 0 ? targetFailureArms : armNames;
  const failures = computeFailureBreakdown({ runs, armNames: failureArms });

  return {
    generatedAt,
    model,
    runsPerTask,
    arms,
    buckets,
    intersection,
    failures,
  };
}
