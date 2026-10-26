#!/usr/bin/env node

// checkmate — Gain Scoreboard & Real Session Telemetry
// Reads benchmarks/results/summary.json and prints a compact plain-text scoreboard.
// Also inspects ~/.claude/projects/*/*.jsonl for real session metrics.
// Edits nothing, changes no mode. Never throws.

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

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
    pct = (val - base) * 100;
  } else {
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

function analyzeRealSessions(customDir = null) {
  const projectsDir = customDir || process.env.CLAUDE_PROJECTS_DIR || join(homedir(), ".claude", "projects");
  if (!existsSync(projectsDir)) {
    return null;
  }

  const subdirs = [];
  try {
    const entries = readdirSync(projectsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        subdirs.push(join(projectsDir, entry.name));
      }
    }
  } catch {
    return null;
  }

  let sessionCount = 0;
  let totalTurns = 0;
  let totalOutputTokens = 0;
  let totalToolCalls = 0;
  const toolCallsPerTurnList = [];
  const outputTokensPerTurnList = [];
  const sessionTokenList = [];
  const commandCounts = {};

  for (const dir of subdirs) {
    let files = [];
    try {
      files = readdirSync(dir).filter(f => f.endsWith(".jsonl"));
    } catch {
      continue;
    }

    for (const file of files) {
      sessionCount++;
      let sessionOutputTokens = 0;

      try {
        const content = readFileSync(join(dir, file), "utf8");
        const lines = content.split("\n");
        for (const line of lines) {
          if (!line.trim()) continue;
          let obj;
          try {
            obj = JSON.parse(line);
          } catch {
            continue;
          }

          if (obj.type === "assistant" && obj.message) {
            totalTurns++;
            const outTok = obj.message?.usage?.output_tokens || 0;
            totalOutputTokens += outTok;
            sessionOutputTokens += outTok;
            outputTokensPerTurnList.push(outTok);

            let toolCallsInTurn = 0;
            const contents = obj.message?.content || [];
            if (Array.isArray(contents)) {
              for (const item of contents) {
                if (item.type === "tool_use") {
                  toolCallsInTurn++;
                  totalToolCalls++;
                  if (item.name === "Bash" && item.input?.command) {
                    const firstWord = item.input.command.trim().split(/\s+/)[0];
                    if (firstWord) {
                      commandCounts[firstWord] = (commandCounts[firstWord] || 0) + 1;
                    }
                  }
                }
              }
            }
            toolCallsPerTurnList.push(toolCallsInTurn);
          }
        }
      } catch {
        // ignore read error
      }

      if (sessionOutputTokens > 0) {
        sessionTokenList.push(sessionOutputTokens);
      }
    }
  }

  if (sessionCount === 0 || totalTurns === 0) {
    return null;
  }

  toolCallsPerTurnList.sort((a, b) => a - b);
  outputTokensPerTurnList.sort((a, b) => a - b);
  sessionTokenList.sort((a, b) => b - a);

  const median = (arr) => {
    if (!arr.length) return 0;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  };

  const avgToolCalls = (totalToolCalls / totalTurns).toFixed(2);
  const medToolCalls = median(toolCallsPerTurnList);
  const avgOutTok = Math.round(totalOutputTokens / totalTurns);
  const medOutTok = Math.round(median(outputTokensPerTurnList));

  const top10Count = Math.max(1, Math.ceil(sessionTokenList.length * 0.1));
  const top10Tokens = sessionTokenList.slice(0, top10Count).reduce((sum, n) => sum + n, 0);
  const top10Percent = totalOutputTokens > 0 ? ((top10Tokens / totalOutputTokens) * 100).toFixed(1) : "0.0";

  const topCommands = Object.entries(commandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cmd, cnt]) => `${cmd} (${cnt}x)`)
    .join(", ");

  return {
    sessionCount,
    totalTurns,
    totalOutputTokens,
    totalToolCalls,
    avgToolCalls,
    medToolCalls,
    avgOutTok,
    medOutTok,
    top10Percent,
    topCommands,
  };
}

function formatRealSessionsLines(stats) {
  if (!stats) return [];
  const lines = [
    "=== real session telemetry (~/.claude/projects) ===",
    `Sessions: ${stats.sessionCount} | Turns: ${stats.totalTurns} | Output tokens: ${stats.totalOutputTokens.toLocaleString()}`,
    `Tool calls/turn : ${stats.avgToolCalls} avg | ${stats.medToolCalls} med`,
    `Output tok/turn : ${stats.avgOutTok} avg | ${stats.medOutTok} med`,
    `Concentration   : Top 10% longest sessions account for ${stats.top10Percent}% of total output tokens`,
  ];
  if (stats.topCommands) {
    lines.push(`Top commands    : ${stats.topCommands}`);
  }
  return lines;
}

function printScoreboard() {
  const args = process.argv.slice(2);
  const onlySessions = args.includes("--sessions") || args.includes("--real");
  const onlyBench = args.includes("--bench");

  const summaryPath = findSummaryPath();
  let benchmarkData = null;

  if (!onlySessions && summaryPath) {
    try {
      const raw = readFileSync(summaryPath, "utf8");
      benchmarkData = JSON.parse(raw);
    } catch {
      benchmarkData = null;
    }
  }

  const realStats = (!onlyBench) ? analyzeRealSessions() : null;

  if (!benchmarkData && !realStats) {
    process.stdout.write("no benchmark data yet: run node benchmarks/run.mjs\n");
    process.exit(0);
  }

  const lines = [];

  if (benchmarkData && benchmarkData.arms && !onlySessions) {
    lines.push("=== checkmate gain scoreboard ===");
    if (benchmarkData.model || benchmarkData.runsPerTask) {
      const metaParts = [];
      if (benchmarkData.model) metaParts.push(`Model: ${benchmarkData.model}`);
      if (benchmarkData.runsPerTask) metaParts.push(`Runs/task: ${benchmarkData.runsPerTask}`);
      if (benchmarkData.generatedAt) metaParts.push(`Generated: ${benchmarkData.generatedAt}`);
      lines.push(metaParts.join(" | "));
    }
    lines.push("");

    const arms = benchmarkData.arms || {};
    const armNames = Object.keys(arms);
    const baseArm = arms["baseline"];

    lines.push("Overall:");
    for (const armName of armNames) {
      lines.push(formatArmLine(armName, arms[armName], baseArm));
    }

    const buckets = benchmarkData.buckets;
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
  }

  if (realStats && !onlyBench) {
    const sessionLines = formatRealSessionsLines(realStats);
    if (lines.length > 0) {
      lines.push("");
    }
    lines.push(...sessionLines);
    lines.push("");
  }

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
