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

function formatRow(scopeLabel, armName, arm, isBoldPass = false) {
  const passStr = isBoldPass
    ? `**${formatPassRate(arm.passRate)}**`
    : formatPassRate(arm.passRate);
  return `| ${scopeLabel} | \`${armName}\` | ${arm.runs} | ${arm.passed} | ${passStr} | ${formatTokens(arm.medianInputTokens, arm.iqrInputTokens)} | ${formatTokens(arm.medianCacheReadTokens, arm.iqrCacheReadTokens)} | ${formatTokens(arm.medianOutputTokens, arm.iqrOutputTokens)} | ${arm.medianTotalTokens ?? "-"} | ${arm.medianSteps ?? "-"} | ${formatWall(arm.medianWallMs)} |`;
}

export function generateMarkdownReport(summary) {
  const lines = [];
  lines.push(
    `*Benchmark summary generated at ${summary.generatedAt} using model \`${summary.model}\` (${summary.runsPerTask} run(s)/task).*`
  );
  lines.push("");
  lines.push("### View 1: Overall (Per-Arm Passed Runs)");
  lines.push("");
  lines.push(
    "*Standard view: medians (tokens, steps, wall) are computed over each arm's own passed runs.*"
  );
  lines.push("");
  lines.push(
    "| Scope | Arm | Runs | Passed | Pass Rate | Uncached In | Cache Read | Output | Total Tokens | Steps | Wall |"
  );
  lines.push(
    "| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |"
  );

  // 1. Overall
  if (summary.arms) {
    for (const [armName, arm] of Object.entries(summary.arms)) {
      lines.push(formatRow("**Overall**", armName, arm, true));
    }
  }

  // 2. Buckets
  if (summary.buckets) {
    for (const [bucketName, bucketArms] of Object.entries(summary.buckets)) {
      const bucketLabel =
        bucketName.charAt(0).toUpperCase() + bucketName.slice(1);
      for (const [armName, arm] of Object.entries(bucketArms)) {
        lines.push(formatRow(bucketLabel, armName, arm, false));
      }
    }
  }

  // 3. View 2: Shared-Set View (Strict Paired Intersection)
  if (
    summary.intersection &&
    summary.intersection.arms &&
    Object.keys(summary.intersection.arms).length > 0
  ) {
    const taskCount =
      summary.intersection.taskCount ??
      summary.intersection.sharedTaskCount ??
      0;
    lines.push("");
    lines.push("### View 2: Shared-Set (Identical Tasks Where All Arms Passed)");
    lines.push("");
    lines.push(
      `*Paired intersection across ${taskCount} identical task(s) where ALL evaluated arms passed 100% of runs (eliminating survivorship bias).*`
    );
    lines.push("");
    lines.push(
      "| Arm | Shared Tasks | Pass Rate | Uncached In | Cache Read | Output | Total Tokens | Steps | Wall |"
    );
    lines.push(
      "| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |"
    );
    for (const [armName, arm] of Object.entries(summary.intersection.arms)) {
      lines.push(
        `| \`${armName}\` | ${taskCount} | ${formatPassRate(arm.passRate)} | ${formatTokens(arm.medianInputTokens, arm.iqrInputTokens)} | ${formatTokens(arm.medianCacheReadTokens, arm.iqrCacheReadTokens)} | ${formatTokens(arm.medianOutputTokens, arm.iqrOutputTokens)} | ${arm.medianTotalTokens ?? "-"} | ${arm.medianSteps ?? "-"} | ${formatWall(arm.medianWallMs)} |`
      );
    }
  }

  // 4. Failure Breakdown
  if (summary.failures && typeof summary.failures === "object" && Object.keys(summary.failures).length > 0) {
    lines.push("");
    lines.push("### Failure Breakdown");
    lines.push("");
    lines.push(
      "*Every failed run in `checkmate` and `ultra` arms is classified from actual run logs and test outputs into 5 root-cause categories.*"
    );

    for (const [armName, failData] of Object.entries(summary.failures)) {
      lines.push("");
      lines.push(
        `#### \`${armName}\` Failure Analysis (${failData.failed} failed of ${failData.runs} runs)`
      );
      lines.push("");
      lines.push("| Failure Category | Count | % of Failures |");
      lines.push("| :--- | :---: | :---: |");

      const cats = failData.categories || {};
      const totalFailed = failData.failed || 0;
      for (const [catName, count] of Object.entries(cats)) {
        const pct =
          totalFailed > 0 ? ((count / totalFailed) * 100).toFixed(1) + "%" : "0.0%";
        lines.push(`| ${catName} | ${count} | ${pct} |`);
      }

      lines.push("");
      if (failData.taskIds && failData.taskIds.length > 0) {
        const taskListStr = failData.taskIds.map((t) => `\`${t}\``).join(", ");
        lines.push(`**Failing Task IDs:** ${taskListStr}`);
      } else {
        lines.push("**Failing Task IDs:** *None (100% pass)*");
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
