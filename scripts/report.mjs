#!/usr/bin/env node
// scripts/report.mjs — Formats benchmark results into a markdown table
// Zero external dependencies. Node 22 ESM.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const START_MARKER = "<!-- results:start -->";
const END_MARKER = "<!-- results:end -->";

function formatTokens(median, iqr) {
  if (median === null || median === undefined) return "-";
  if (Array.isArray(iqr) && iqr.length === 2) {
    return `${median} [${iqr[0]}–${iqr[1]}]`;
  }
  return String(median);
}

function formatWall(ms) {
  if (ms === null || ms === undefined) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatPassRate(rate) {
  if (rate === null || rate === undefined) return "0.0%";
  return `${(rate * 100).toFixed(1)}%`;
}

export function generateMarkdownReport(summary) {
  const lines = [];
  lines.push(
    `*Benchmark summary generated at ${summary.generatedAt} using model \`${summary.model}\` (${summary.runsPerTask} run(s)/task).*`
  );
  lines.push("");
  lines.push(
    "| Scope | Arm | Runs | Passed | Pass Rate | Median Output Tokens (IQR) | Median Total Tokens | Median Steps | Median Wall |"
  );
  lines.push(
    "| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |"
  );

  // 1. Overall
  if (summary.arms) {
    for (const [armName, arm] of Object.entries(summary.arms)) {
      lines.push(
        `| **Overall** | \`${armName}\` | ${arm.runs} | ${arm.passed} | **${formatPassRate(arm.passRate)}** | ${formatTokens(arm.medianOutputTokens, arm.iqrOutputTokens)} | ${arm.medianTotalTokens ?? "-"} | ${arm.medianSteps ?? "-"} | ${formatWall(arm.medianWallMs)} |`
      );
    }
  }

  // 2. Buckets
  if (summary.buckets) {
    for (const [bucketName, bucketArms] of Object.entries(summary.buckets)) {
      const bucketLabel =
        bucketName.charAt(0).toUpperCase() + bucketName.slice(1);
      for (const [armName, arm] of Object.entries(bucketArms)) {
        lines.push(
          `| ${bucketLabel} | \`${armName}\` | ${arm.runs} | ${arm.passed} | ${formatPassRate(arm.passRate)} | ${formatTokens(arm.medianOutputTokens, arm.iqrOutputTokens)} | ${arm.medianTotalTokens ?? "-"} | ${arm.medianSteps ?? "-"} | ${formatWall(arm.medianWallMs)} |`
        );
      }
    }
  }

  return lines.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  let summaryPath = resolve("benchmarks/results/summary.json");
  let targetFilePath = resolve(args[0] || "README.md");

  // Optional custom summary flag
  const summaryFlagIdx = args.indexOf("--summary");
  if (summaryFlagIdx !== -1 && args[summaryFlagIdx + 1]) {
    summaryPath = resolve(args[summaryFlagIdx + 1]);
  }

  if (!existsSync(summaryPath)) {
    console.error(`Error: Summary file not found at ${summaryPath}`);
    process.exit(1);
  }

  const rawSummary = readFileSync(summaryPath, "utf8");
  const summary = JSON.parse(rawSummary);
  const tableMarkdown = generateMarkdownReport(summary);

  if (existsSync(targetFilePath)) {
    const fileContent = readFileSync(targetFilePath, "utf8");
    const startIndex = fileContent.indexOf(START_MARKER);
    const endIndex = fileContent.indexOf(END_MARKER);

    if (
      startIndex !== -1 &&
      endIndex !== -1 &&
      endIndex > startIndex
    ) {
      const before = fileContent.slice(0, startIndex + START_MARKER.length);
      const after = fileContent.slice(endIndex);
      const updated = `${before}\n\n${tableMarkdown}\n\n${after}`;
      writeFileSync(targetFilePath, updated, "utf8");
      console.log(`Updated benchmark results in ${targetFilePath}`);
      return;
    }
  }

  // If file doesn't exist or markers not found: print table to stdout
  console.log(tableMarkdown);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  main();
}
