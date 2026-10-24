#!/usr/bin/env node

// checkmate — Gain Scoreboard
// Reads benchmarks/results/summary.json and prints a compact plain-text scoreboard.
// Edits nothing, changes no mode. Never throws.

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

function findSummaryPath() {
  if (process.env.CHECKMATE_SUMMARY && existsSync(process.env.CHECKMATE_SUMMARY)) {
    return process.env.CHECKMATE_SUMMARY;
  }

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    process.env.CLAUDE_PLUGIN_ROOT
      ? join(process.env.CLAUDE_PLUGIN_ROOT, "benchmarks", "results", "summary.json")
      : null,
    join(scriptDir, "..", "..", "benchmarks", "results", "summary.json"),
    join(process.cwd(), "benchmarks", "results", "summary.json"),
  ];

  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function formatPercent(val) {
  if (typeof val !== "number" || isNaN(val)) return "n/a";
  return `${(val * 100).toFixed(1)}%`;
}

function formatDelta(val, base, isPassRate = false) {
  if (
    typeof val !== "number" ||
    typeof base !== "number" ||
    isNaN(val) ||
    isNaN(base) ||
    base === 0
  ) {
    return "";
  }
  let pct;
  if (isPassRate) {
    // Percentage points delta for pass rate
    pct = (val - base) * 100;
  } else {
    // Relative % change for tokens and steps
    pct = ((val - base) / base) * 100;
  }
  const sign = pct > 0 ? "+" : "";
  return ` (${sign}${pct.toFixed(1)}%)`;
}

function formatStat(num) {
  if (typeof num !== "number" || isNaN(num) || num === null) return "n/a";
  return Number.isInteger(num) ? `${num}` : num.toFixed(1);
}

function formatArmLine(name, arm, baseArm, padName = 10) {
  const passStr = arm.passRate !== undefined ? formatPercent(arm.passRate) : "n/a";
  const passDelta = baseArm && name !== "baseline" ? formatDelta(arm.passRate, baseArm.passRate, true) : "";

  const tokStr = arm.medianOutputTokens !== null && arm.medianOutputTokens !== undefined ? formatStat(arm.medianOutputTokens) : "n/a";
  const tokDelta = baseArm && name !== "baseline" ? formatDelta(arm.medianOutputTokens, baseArm.medianOutputTokens, false) : "";

  const stepStr = arm.medianSteps !== null && arm.medianSteps !== undefined ? formatStat(arm.medianSteps) : "n/a";
  const stepDelta = baseArm && name !== "baseline" ? formatDelta(arm.medianSteps, baseArm.medianSteps, false) : "";

  return `  ${name.padEnd(padName)}: ${passStr}${passDelta} pass | ${tokStr}${tokDelta} med tokens | ${stepStr}${stepDelta} med steps`;
}

function printScoreboard() {
  const summaryPath = findSummaryPath();
  if (!summaryPath) {
    process.stdout.write("no benchmark data yet: run node benchmarks/run.mjs\n");
    process.exit(0);
  }

  let data;
  try {
    const raw = readFileSync(summaryPath, "utf8");
    data = JSON.parse(raw);
  } catch {
    process.stdout.write("no benchmark data yet: run node benchmarks/run.mjs\n");
    process.exit(0);
  }

  if (!data || typeof data !== "object" || !data.arms) {
    process.stdout.write("no benchmark data yet: run node benchmarks/run.mjs\n");
    process.exit(0);
  }

  const lines = [];
  lines.push("=== checkmate gain scoreboard ===");
  if (data.model || data.runsPerTask) {
    const metaParts = [];
    if (data.model) metaParts.push(`Model: ${data.model}`);
    if (data.runsPerTask) metaParts.push(`Runs/task: ${data.runsPerTask}`);
    if (data.generatedAt) metaParts.push(`Generated: ${data.generatedAt}`);
    lines.push(metaParts.join(" | "));
  }
  lines.push("");

  const arms = data.arms || {};
  const armNames = Object.keys(arms);
  const baseArm = arms["baseline"];

  lines.push("Overall:");
  for (const armName of armNames) {
    lines.push(formatArmLine(armName, arms[armName], baseArm));
  }

  const buckets = data.buckets;
  if (buckets && typeof buckets === "object" && Object.keys(buckets).length > 0) {
    lines.push("");
    lines.push("By Bucket (pass-rate | med tokens | med steps):");
    for (const [bucketName, bucketArms] of Object.entries(buckets)) {
      lines.push(`  [${bucketName}]`);
      const bucketBase = bucketArms["baseline"];
      for (const [armName, armData] of Object.entries(bucketArms)) {
        lines.push(`  ${formatArmLine(armName, armData, bucketBase, 12)}`);
      }
    }
  }

  lines.push("");
  process.stdout.write(lines.join("\n"));
  process.exit(0);
}

try {
  printScoreboard();
} catch {
  // Never throw
  process.stdout.write("no benchmark data yet: run node benchmarks/run.mjs\n");
  process.exit(0);
}
