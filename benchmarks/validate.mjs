#!/usr/bin/env node
// benchmarks/validate.mjs — Automated validator for all benchmark check.mjs scripts
// Zero external dependencies. Node 22 ESM.

import {
  readdirSync,
  existsSync,
  cpSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const BUCKETS = ["feature", "bugfix", "refactor", "qa"];
const ROOT_DIR = process.cwd();

function runCheck(checkScriptPath, workdir, extraArg = null) {
  const args = [checkScriptPath, workdir];
  if (extraArg) args.push(extraArg);

  const res = spawnSync("node", args, {
    cwd: workdir,
    encoding: "utf8",
    timeout: 10000,
  });

  return {
    status: res.status,
    stdout: res.stdout || "",
    stderr: res.stderr || "",
  };
}

export function validateAllTasks() {
  const tasks = [];
  for (const bucket of BUCKETS) {
    const bucketDir = join(ROOT_DIR, "benchmarks", "tasks", bucket);
    if (!existsSync(bucketDir)) continue;
    const taskIds = readdirSync(bucketDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    for (const id of taskIds) {
      tasks.push({ id, bucket, dir: join(bucketDir, id) });
    }
  }

  console.log(`Discovered ${tasks.length} benchmark tasks to validate.\n`);

  let passCount = 0;
  let failCount = 0;
  const failures = [];

  for (const task of tasks) {
    const { id, bucket, dir } = task;
    const fixtureDir = join(dir, "fixture");
    const checkScript = join(dir, "check.mjs");
    const refDir = join(ROOT_DIR, "benchmarks", "reference", id);

    if (!existsSync(fixtureDir) || !existsSync(checkScript)) {
      console.error(`[FAIL] ${id}: Missing fixture or check.mjs`);
      failCount++;
      failures.push({ id, reason: "Missing fixture or check.mjs" });
      continue;
    }

    // Step 1: Untouched fixture must FAIL check.mjs
    const untouchedWorkdir = mkdtempSync(join(tmpdir(), `checkmate-val-${id}-untouched-`));
    let untouchedFailedAsExpected = false;
    let untouchedErr = "";

    try {
      cpSync(fixtureDir, untouchedWorkdir, { recursive: true });

      if (bucket === "qa") {
        const dummyWrongFile = join(untouchedWorkdir, "wrong-answer.txt");
        writeFileSync(dummyWrongFile, "completely_wrong_answer_xyz_9999\n", "utf8");
        const res = runCheck(checkScript, untouchedWorkdir, dummyWrongFile);
        if (res.status !== 0) {
          untouchedFailedAsExpected = true;
        } else {
          untouchedErr = `Untouched fixture unexpectedly PASSED check.mjs for QA. Output: ${res.stdout}`;
        }
      } else {
        const res = runCheck(checkScript, untouchedWorkdir);
        if (res.status !== 0) {
          untouchedFailedAsExpected = true;
        } else {
          untouchedErr = `Untouched fixture unexpectedly PASSED check.mjs. Output: ${res.stdout}`;
        }
      }
    } finally {
      rmSync(untouchedWorkdir, { recursive: true, force: true });
    }

    if (!untouchedFailedAsExpected) {
      console.error(`[FAIL] ${id}: ${untouchedErr}`);
      failCount++;
      failures.push({ id, reason: untouchedErr });
      continue;
    }

    // Step 2: Reference solution must PASS check.mjs
    const refWorkdir = mkdtempSync(join(tmpdir(), `checkmate-val-${id}-ref-`));
    let refPassedAsExpected = false;
    let refErr = "";

    try {
      cpSync(fixtureDir, refWorkdir, { recursive: true });

      if (bucket === "qa") {
        const answerFile = join(refDir, "answer.txt");
        if (!existsSync(answerFile)) {
          refErr = `Reference answer.txt missing at ${answerFile}`;
        } else {
          const res = runCheck(checkScript, refWorkdir, answerFile);
          if (res.status === 0) {
            refPassedAsExpected = true;
          } else {
            refErr = `Reference solution FAILED check.mjs. Exit ${res.status}: ${res.stderr || res.stdout}`;
          }
        }
      } else {
        if (!existsSync(refDir)) {
          refErr = `Reference solution dir missing at ${refDir}`;
        } else {
          cpSync(refDir, refWorkdir, { recursive: true });
          const res = runCheck(checkScript, refWorkdir);
          if (res.status === 0) {
            refPassedAsExpected = true;
          } else {
            refErr = `Reference solution FAILED check.mjs. Exit ${res.status}: ${res.stderr || res.stdout}`;
          }
        }
      }
    } finally {
      rmSync(refWorkdir, { recursive: true, force: true });
    }

    if (!refPassedAsExpected) {
      console.error(`[FAIL] ${id}: ${refErr}`);
      failCount++;
      failures.push({ id, reason: refErr });
      continue;
    }

    passCount++;
    console.log(`[PASS] ${id} (${bucket}): untouched fails, reference passes`);
  }

  console.log(`\n========================================`);
  console.log(`Validation Results: ${passCount} passed, ${failCount} failed (${tasks.length} total)`);
  console.log(`========================================`);

  if (failCount > 0) {
    console.error(`\nFailures:`);
    for (const f of failures) {
      console.error(` - ${f.id}: ${f.reason}`);
    }
    process.exit(1);
  }

  process.exit(0);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  validateAllTasks();
}
