#!/usr/bin/env node
// benchmarks/run.mjs — Benchmark runner for checkmate
// Zero external dependencies. Node 22 ESM.

import {
  readdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  cpSync,
  existsSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync, spawn } from "node:child_process";
import { computeSummary, classifyFailure } from "./stats.mjs";
import { generateMarkdownReport } from "../scripts/report.mjs";

const ROOT_DIR = resolve(process.cwd());
const BUCKETS = ["feature", "bugfix", "refactor", "qa", "integrate"];

// Parse CLI flags
function parseArgs(args) {
  const envModel =
    process.env.CHECKMATE_BENCHMARK_MODEL ||
    process.env.MODEL ||
    process.env.ANTHROPIC_MODEL;

  const flags = {
    arms: ["baseline", "checkmate", "ultra"],
    runs: 3,
    tasks: null,
    model: envModel || "claude-sonnet-5-5",
    concurrency: 1,
    out: null,
    realistic: false,
    settingSources: undefined,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--arms" && args[i + 1]) {
      flags.arms = args[++i].split(",").map((s) => s.trim().toLowerCase());
    } else if (arg === "--realistic") {
      flags.realistic = true;
      if (!args.includes("--arms")) {
        flags.arms = ["baseline", "checkmate", "realistic-baseline", "realistic-checkmate"];
      }
    } else if (arg === "--setting-sources" && args[i + 1] !== undefined) {
      flags.settingSources = args[++i];
    } else if (arg === "--runs" && args[i + 1]) {
      flags.runs = parseInt(args[++i], 10) || 3;
    } else if (arg === "--tasks" && args[i + 1]) {
      flags.tasks = args[++i].trim();
    } else if (arg === "--model" && args[i + 1]) {
      flags.model = args[++i].trim();
    } else if (arg === "--concurrency" && args[i + 1]) {
      flags.concurrency = parseInt(args[++i], 10) || 1;
    } else if (arg === "--out" && args[i + 1]) {
      flags.out = resolve(args[++i]);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!flags.out) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    flags.out = join(ROOT_DIR, "benchmarks", "results", timestamp);
  }

  return flags;
}

function printHelp() {
  console.log(`
Usage: node benchmarks/run.mjs [options]

Options:
  --arms <list>         Comma-separated arms: baseline,checkmate,ultra,realistic-baseline,realistic-checkmate (default: baseline,checkmate)
  --realistic           Benchmark with representative project context (CLAUDE.md and concise guidelines)
  --setting-sources <s> Setting sources passed to claude (default: "" for standard arms, "project" for realistic arms)
  --runs <N>            Number of runs per task (default: 3)
  --tasks <filter>      Filter tasks by id, bucket, or comma-separated list
  --model <model>       Model to evaluate (default: claude-opus-5-5)
  --concurrency <N>     Parallel worker concurrency (default: 1)
  --out <dir>           Output directory (default: benchmarks/results/<timestamp>/)
  --help, -h            Show this help message
`);
}

// Fetch rules payload from hook
function getArmPayload(arm) {
  if (arm === "baseline" || arm === "realistic-baseline" || arm === "realistic") return "";
  const mode = arm.includes("ultra") ? "ultra" : arm.includes("lite") ? "lite" : "full";
  const res = spawnSync(
    "node",
    ["hooks/checkmate-instructions.js"],
    {
      cwd: ROOT_DIR,
      env: { ...process.env, CHECKMATE_DEFAULT_MODE: mode },
      encoding: "utf8",
    }
  );
  if (res.status !== 0) {
    console.error(`Warning: Failed to fetch payload for arm "${arm}": ${res.stderr}`);
    return "";
  }
  return res.stdout || "";
}

// Discover and filter tasks
function loadTasks(taskFilter) {
  const tasks = [];
  const filterList = taskFilter
    ? taskFilter.split(",").map((s) => s.trim().toLowerCase())
    : null;

  for (const bucket of BUCKETS) {
    const bucketDir = join(ROOT_DIR, "benchmarks", "tasks", bucket);
    if (!existsSync(bucketDir)) continue;

    const entries = readdirSync(bucketDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    for (const id of entries) {
      if (filterList) {
        const matches = filterList.some(
          (f) =>
            id.toLowerCase() === f ||
            id.toLowerCase().includes(f) ||
            bucket.toLowerCase() === f
        );
        if (!matches) continue;
      }

      const taskDir = join(bucketDir, id);
      const jsonPath = join(taskDir, "task.json");
      const checkPath = join(taskDir, "check.mjs");
      const fixtureDir = join(taskDir, "fixture");

      if (!existsSync(jsonPath) || !existsSync(checkPath) || !existsSync(fixtureDir)) {
        continue;
      }

      const taskJson = JSON.parse(readFileSync(jsonPath, "utf8"));
      tasks.push({
        id: taskJson.id || id,
        bucket: taskJson.bucket || bucket,
        prompt: taskJson.prompt,
        taskDir,
        checkPath,
        fixtureDir,
      });
    }
  }

  return tasks;
}

// Shuffle helper (Fisher-Yates)
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Execute a single Claude run
async function executeRun({ task, arm, runNumber, payload, model, flags }) {
  const startTime = Date.now();
  const tempDir = mkdtempSync(
    join(tmpdir(), `checkmate-bench-${task.id}-${arm}-${runNumber}-`)
  );

  let rawOutput = "";
  let errorMsg = null;
  let locPersisted = 0;
  let locAdded = 0;
  let locDeleted = 0;

  try {
    // 1. Copy fixture to temp directory
    cpSync(task.fixtureDir, tempDir, { recursive: true });

    // Optional realistic context setup (strictly for realistic arms)
    const isRealistic = arm.startsWith("realistic");
    if (isRealistic) {
      const claudeDir = join(tempDir, ".claude");
      mkdirSync(claudeDir, { recursive: true });
      writeFileSync(
        join(claudeDir, "settings.json"),
        JSON.stringify({ outputStyle: "concise" }, null, 2) + "\n",
        "utf8"
      );

      const realisticClaudeMd = `# Project Guidelines

## Code Standards
- Keep code clean, idiomatic, and minimal.
- Do not introduce unrequested abstractions, files, or extra dependencies.
- Ensure all tests pass before completing.

## Output Style: Concise
- Be direct and concise.
- Stop when the task is done without unnecessary pleasantries or closing offers.
`;
      writeFileSync(join(tempDir, "CLAUDE.md"), realisticClaudeMd, "utf8");
    }

    // 2. Initialize git repository in fixture
    spawnSync("git", ["init"], { cwd: tempDir, stdio: "ignore" });
    spawnSync("git", ["config", "user.name", "checkmate-benchmark"], {
      cwd: tempDir,
      stdio: "ignore",
    });
    spawnSync("git", ["config", "user.email", "benchmark@checkmate.local"], {
      cwd: tempDir,
      stdio: "ignore",
    });
    spawnSync("git", ["add", "-A"], { cwd: tempDir, stdio: "ignore" });
    spawnSync("git", ["commit", "-m", "initial fixture", "--allow-empty"], {
      cwd: tempDir,
      stdio: "ignore",
    });

    // 3. Prepare claude invocation
    const settingSources = flags && flags.settingSources !== undefined
      ? flags.settingSources
      : (isRealistic ? "project" : "");

    const claudeArgs = [
      "-p",
      task.prompt,
      "--output-format",
      "json",
      "--model",
      model,
      "--dangerously-skip-permissions",
      "--strict-mcp-config",
      "--setting-sources",
      settingSources,
    ];

    if (payload && payload.trim()) {
      claudeArgs.push("--append-system-prompt", payload);
    }

    // 4. Run claude process
    const proc = spawnSync("claude", claudeArgs, {
      cwd: tempDir,
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
      timeout: 180000, // 3 min timeout
    });

    rawOutput = proc.stdout || "";
    if (proc.error) {
      errorMsg = proc.error.message;
    } else if (proc.status !== 0 && !rawOutput) {
      errorMsg = `Claude process exited with code ${proc.status}: ${proc.stderr}`;
    }

    // 5. Calculate persisted LOC
    spawnSync("git", ["add", "-N", "."], { cwd: tempDir, stdio: "ignore" });
    const diffProc = spawnSync("git", ["diff", "--numstat"], {
      cwd: tempDir,
      encoding: "utf8",
    });
    if (diffProc.stdout) {
      const diffLines = diffProc.stdout.trim().split("\n");
      for (const line of diffLines) {
        const parts = line.split("\t");
        if (parts.length >= 2) {
          const a = parseInt(parts[0], 10) || 0;
          const d = parseInt(parts[1], 10) || 0;
          locAdded += a;
          locDeleted += d;
        }
      }
      locPersisted = locAdded + locDeleted;
    }

    // 6. Parse JSON output
    let parsed = null;
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      // Sometimes extra text precedes or follows JSON
      const jsonStart = rawOutput.indexOf("{");
      const jsonEnd = rawOutput.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        try {
          parsed = JSON.parse(rawOutput.slice(jsonStart, jsonEnd + 1));
        } catch (e) {
          errorMsg = errorMsg || `JSON parse failure: ${e.message}`;
        }
      } else {
        errorMsg = errorMsg || "No JSON output found in Claude response";
      }
    }

    const outputTokens = parsed?.usage?.output_tokens ?? 0;
    const inputTokens = parsed?.usage?.input_tokens ?? 0;
    const cacheCreation = parsed?.usage?.cache_creation_input_tokens ?? 0;
    const cacheRead = parsed?.usage?.cache_read_input_tokens ?? 0;
    const totalTokens = inputTokens + cacheCreation + cacheRead + outputTokens;
    const steps = parsed?.num_turns ?? 1;
    const wallMs = parsed?.duration_ms ?? Date.now() - startTime;
    const agentResultText = parsed?.result ?? "";

    // 7. Run task validation (check.mjs)
    let passed = false;
    let checkArgs = [task.checkPath, tempDir];

    if (task.bucket === "qa") {
      const resultFile = join(tempDir, ".agent-result.txt");
      writeFileSync(resultFile, agentResultText, "utf8");
      checkArgs.push(resultFile);
    }

    const checkRes = spawnSync("node", checkArgs, {
      cwd: tempDir,
      encoding: "utf8",
      timeout: 10000,
    });

    passed = checkRes.status === 0;
    const checkOutput =
      (checkRes.stderr ? checkRes.stderr + "\n" : "") + (checkRes.stdout || "");
    const failureReason = passed
      ? null
      : classifyFailure({
          passed: false,
          error: errorMsg,
          checkOutput,
          agentOutput: agentResultText,
          wallMs,
          locPersisted,
          bucket: task.bucket,
        });

    return {
      taskId: task.id,
      bucket: task.bucket,
      arm,
      run: runNumber,
      passed,
      inputTokens,
      cacheReadTokens: cacheRead,
      cacheCreationTokens: cacheCreation,
      outputTokens,
      totalTokens,
      steps,
      wallMs,
      locPersisted,
      locAdded,
      locDeleted,
      checkOutput: passed ? null : checkOutput.trim(),
      agentOutput: agentResultText ? agentResultText.slice(0, 500) : null,
      failureReason,
      error:
        errorMsg ||
        (passed ? null : checkOutput.trim() || "Verification failed"),
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      taskId: task.id,
      bucket: task.bucket,
      arm,
      run: runNumber,
      passed: false,
      inputTokens: 0,
      cacheReadTokens: 0,
      cacheCreationTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      steps: 1,
      wallMs: Date.now() - startTime,
      locPersisted: 0,
      locAdded: 0,
      locDeleted: 0,
      checkOutput: err.message,
      agentOutput: null,
      failureReason: classifyFailure({
        passed: false,
        error: err.message,
        wallMs: Date.now() - startTime,
      }),
      error: err.message,
      timestamp: new Date().toISOString(),
    };
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

// Concurrency pool runner
async function runPool(queue, concurrency, onRunComplete) {
  let index = 0;
  const results = [];

  async function worker() {
    while (index < queue.length) {
      const itemIndex = index++;
      const item = queue[itemIndex];
      const res = await executeRun(item);
      results[itemIndex] = res;
      onRunComplete(res, itemIndex + 1, queue.length);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, queue.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));

  console.log("=== Checkmate Benchmark Runner ===");
  console.log(`Arms:         ${flags.arms.join(", ")}`);
  console.log(`Runs / Task:  ${flags.runs}`);
  console.log(`Model:        ${flags.model}`);
  console.log(`Concurrency:  ${flags.concurrency}`);
  console.log(`Output Dir:   ${flags.out}`);
  if (flags.tasks) console.log(`Task Filter:  ${flags.tasks}`);
  console.log("===================================\n");

  mkdirSync(flags.out, { recursive: true });
  mkdirSync(join(ROOT_DIR, "benchmarks", "results"), { recursive: true });

  // 1. Fetch payloads for arms
  const payloads = {};
  for (const arm of flags.arms) {
    payloads[arm] = getArmPayload(arm);
  }

  // 2. Discover tasks
  const tasks = loadTasks(flags.tasks);
  if (tasks.length === 0) {
    console.error("No matching tasks found!");
    process.exit(1);
  }
  console.log(`Loaded ${tasks.length} task(s).`);

  // 3. Build evaluation matrix and shuffle
  const runQueue = [];
  for (let r = 1; r <= flags.runs; r++) {
    for (const task of tasks) {
      for (const arm of flags.arms) {
        runQueue.push({
          task,
          arm,
          runNumber: r,
          payload: payloads[arm],
          model: flags.model,
          flags,
        });
      }
    }
  }

  const randomizedQueue = shuffle(runQueue);
  console.log(`Total evaluation runs to execute: ${randomizedQueue.length}\n`);

  const rawJsonlPath = join(flags.out, "raw.jsonl");
  const rawResults = [];

  const onRunComplete = (res, current, total) => {
    rawResults.push(res);
    appendFileSync(rawJsonlPath, JSON.stringify(res) + "\n", "utf8");

    const statusStr = res.passed ? "PASS" : "FAIL";
    const statusFmt = res.passed ? `\x1b[32m${statusStr}\x1b[0m` : `\x1b[31m${statusStr}\x1b[0m`;
    const tokensStr = res.outputTokens ? `${res.outputTokens} out tok` : "0 tok";
    const wallStr = `${(res.wallMs / 1000).toFixed(1)}s`;

    console.log(
      `[${current}/${total}] ${res.taskId.padEnd(28)} | ${res.arm.padEnd(10)} | run ${res.run} | ${statusFmt} | ${tokensStr.padEnd(12)} | ${String(res.steps).padStart(2)} step(s) | ${wallStr}`
    );
  };

  await runPool(randomizedQueue, flags.concurrency, onRunComplete);

  // 4. Compute summary
  const summary = computeSummary({
    runs: rawResults,
    model: flags.model,
    runsPerTask: flags.runs,
    armNames: flags.arms,
    bucketNames: BUCKETS,
  });

  const summaryJsonPath = join(flags.out, "summary.json");
  const summaryJsonStr = JSON.stringify(summary, null, 2) + "\n";
  writeFileSync(summaryJsonPath, summaryJsonStr, "utf8");

  // Also copy summary.json to shared contract destination benchmarks/results/summary.json
  const sharedSummaryPath = join(ROOT_DIR, "benchmarks", "results", "summary.json");
  writeFileSync(sharedSummaryPath, summaryJsonStr, "utf8");

  // Keep per-model results in separate files
  const modelSlug = flags.model.replace(/[^a-zA-Z0-9._-]/g, "_");
  const perModelSummaryPath = join(ROOT_DIR, "benchmarks", "results", `summary-${modelSlug}.json`);
  const perModelRawPath = join(ROOT_DIR, "benchmarks", "results", `raw-${modelSlug}.jsonl`);
  writeFileSync(perModelSummaryPath, summaryJsonStr, "utf8");
  copyFileSync(rawJsonlPath, perModelRawPath);

  console.log(`\nResults written to:`);
  console.log(`  - ${rawJsonlPath}`);
  console.log(`  - ${summaryJsonPath}`);
  console.log(`  - ${sharedSummaryPath}`);
  console.log(`  - ${perModelSummaryPath}`);
  console.log(`  - ${perModelRawPath}\n`);

  console.log("=== Benchmark Summary Table ===");
  console.log(generateMarkdownReport(summary));
  console.log("===============================\n");
}

main().catch((err) => {
  console.error("Benchmark runner failed:", err);
  process.exit(1);
});
