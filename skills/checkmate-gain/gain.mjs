#!/usr/bin/env node

// checkmate — Gain Scoreboard & Real Session Telemetry
// Reads benchmarks/results/summary.json and prints a compact plain-text scoreboard.
// Also inspects ~/.claude/projects/*/*.jsonl for real session metrics (deduplicated by message.id)
// and compares checkmate sessions against baseline sessions.
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

// Checkmate rules reach a session only through the SessionStart hook. Match that hook output,
// not raw transcript text: diffs and file reads of rules/checkmate.md contain the same phrases.
function isCheckmateInjection(obj) {
  const att = obj.attachment;
  if (obj.type !== "attachment" || !att || att.hookEvent !== "SessionStart") return false;
  const text = [att.stdout, att.content].find(v => typeof v === "string") || "";
  return text.includes("Goal-driven mode");
}

function analyzeTranscriptFile(filePath) {
  let sessionOutputTokens = 0;
  let sessionTurns = 0;
  let sessionToolCalls = 0;
  const turnOutputTokens = [];
  const turnToolCalls = [];
  const commandCounts = {};
  const seenMessages = new Set();
  let hasCheckmate = false;

  try {
    const content = readFileSync(filePath, "utf8");

    const lines = content.split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      let obj;
      try {
        obj = JSON.parse(line);
      } catch {
        continue;
      }

      if (isCheckmateInjection(obj)) {
        hasCheckmate = true;
      }

      if (obj.type === "assistant" && obj.message) {
        const msgId = obj.message.id;
        // Group by message.id to avoid duplicate counts from multi-record chunk writes
        if (msgId && seenMessages.has(msgId)) {
          continue;
        }
        if (msgId) {
          seenMessages.add(msgId);
        }

        sessionTurns++;
        const outTok = obj.message?.usage?.output_tokens || 0;
        sessionOutputTokens += outTok;
        turnOutputTokens.push(outTok);

        let toolCallsInTurn = 0;
        const contents = obj.message?.content || [];
        if (Array.isArray(contents)) {
          for (const item of contents) {
            if (item.type === "tool_use") {
              toolCallsInTurn++;
              sessionToolCalls++;
              if (item.name === "Bash" && item.input?.command) {
                const firstWord = item.input.command.trim().split(/\s+/)[0];
                if (firstWord) {
                  commandCounts[firstWord] = (commandCounts[firstWord] || 0) + 1;
                }
              }
            }
          }
        }
        turnToolCalls.push(toolCallsInTurn);
      }
    }
  } catch {
    // ignore read error
  }

  return {
    hasCheckmate,
    sessionOutputTokens,
    sessionTurns,
    sessionToolCalls,
    turnOutputTokens,
    turnToolCalls,
    commandCounts,
  };
}

function computeGroupMetrics(sessions) {
  if (sessions.length === 0) return null;

  let totalTurns = 0;
  let totalOutputTokens = 0;
  let totalToolCalls = 0;
  const allToolCallsPerTurn = [];
  const allOutputTokensPerTurn = [];
  const sessionTokenList = [];
  const aggregatedCommands = {};

  for (const s of sessions) {
    totalTurns += s.sessionTurns;
    totalOutputTokens += s.sessionOutputTokens;
    totalToolCalls += s.sessionToolCalls;
    allToolCallsPerTurn.push(...s.turnToolCalls);
    allOutputTokensPerTurn.push(...s.turnOutputTokens);
    if (s.sessionOutputTokens > 0) {
      sessionTokenList.push(s.sessionOutputTokens);
    }
    for (const [cmd, cnt] of Object.entries(s.commandCounts)) {
      aggregatedCommands[cmd] = (aggregatedCommands[cmd] || 0) + cnt;
    }
  }

  if (totalTurns === 0) return null;

  allToolCallsPerTurn.sort((a, b) => a - b);
  allOutputTokensPerTurn.sort((a, b) => a - b);
  sessionTokenList.sort((a, b) => b - a);

  const median = (arr) => {
    if (!arr.length) return 0;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  };

  const avgToolCalls = (totalToolCalls / totalTurns).toFixed(2);
  const medToolCalls = median(allToolCallsPerTurn);
  const avgOutTok = Math.round(totalOutputTokens / totalTurns);
  const medOutTok = Math.round(median(allOutputTokensPerTurn));

  const top10Count = Math.max(1, Math.ceil(sessionTokenList.length * 0.1));
  const top10Tokens = sessionTokenList.slice(0, top10Count).reduce((sum, n) => sum + n, 0);
  const top10Percent = totalOutputTokens > 0 ? ((top10Tokens / totalOutputTokens) * 100).toFixed(1) : "0.0";

  const topCommands = Object.entries(aggregatedCommands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cmd, cnt]) => `${cmd} (${cnt}x)`)
    .join(", ");

  return {
    sessionCount: sessions.length,
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

  const checkmateSessions = [];
  const baselineSessions = [];

  for (const dir of subdirs) {
    let files = [];
    try {
      files = readdirSync(dir).filter(f => f.endsWith(".jsonl"));
    } catch {
      continue;
    }

    for (const file of files) {
      const res = analyzeTranscriptFile(join(dir, file));
      if (res.sessionTurns > 0) {
        if (res.hasCheckmate) {
          checkmateSessions.push(res);
        } else {
          baselineSessions.push(res);
        }
      }
    }
  }

  const checkmateStats = computeGroupMetrics(checkmateSessions);
  const baselineStats = computeGroupMetrics(baselineSessions);

  if (!checkmateStats && !baselineStats) {
    return null;
  }

  return {
    checkmate: checkmateStats,
    baseline: baselineStats,
  };
}

function formatRealSessionsLines(telemetry) {
  if (!telemetry) return [];
  const lines = [
    "=== real session telemetry (~/.claude/projects) ===",
  ];

  const { checkmate, baseline } = telemetry;

  if (checkmate && baseline) {
    const avgTokDelta = formatDelta(checkmate.avgOutTok, baseline.avgOutTok, false);
    const medTokDelta = formatDelta(checkmate.medOutTok, baseline.medOutTok, false);
    const avgToolDelta = formatDelta(Number(checkmate.avgToolCalls), Number(baseline.avgToolCalls), false);

    lines.push(`Checkmate Sessions (${checkmate.sessionCount} sessions | ${checkmate.totalTurns} turns):`);
    lines.push(`  Output tok/turn : ${checkmate.avgOutTok} avg${avgTokDelta} | ${checkmate.medOutTok} med${medTokDelta}`);
    lines.push(`  Tool calls/turn : ${checkmate.avgToolCalls} avg${avgToolDelta} | ${checkmate.medToolCalls} med`);
    lines.push(`  Total tokens    : ${checkmate.totalOutputTokens.toLocaleString()}`);
    lines.push("");
    lines.push(`Baseline Sessions (${baseline.sessionCount} sessions | ${baseline.totalTurns} turns):`);
    lines.push(`  Output tok/turn : ${baseline.avgOutTok} avg | ${baseline.medOutTok} med`);
    lines.push(`  Tool calls/turn : ${baseline.avgToolCalls} avg | ${baseline.medToolCalls} med`);
    lines.push(`  Total tokens    : ${baseline.totalOutputTokens.toLocaleString()}`);
    lines.push(`  Concentration   : Top 10% longest sessions account for ${baseline.top10Percent}% of total output tokens`);
    if (baseline.topCommands) {
      lines.push(`  Top commands    : ${baseline.topCommands}`);
    }
  } else if (baseline) {
    lines.push(`Baseline Sessions (${baseline.sessionCount} sessions | ${baseline.totalTurns} turns):`);
    lines.push(`  Output tok/turn : ${baseline.avgOutTok} avg | ${baseline.medOutTok} med`);
    lines.push(`  Tool calls/turn : ${baseline.avgToolCalls} avg | ${baseline.medToolCalls} med`);
    lines.push(`  Total tokens    : ${baseline.totalOutputTokens.toLocaleString()}`);
    lines.push(`  Concentration   : Top 10% longest sessions account for ${baseline.top10Percent}% of total output tokens`);
    if (baseline.topCommands) {
      lines.push(`  Top commands    : ${baseline.topCommands}`);
    }
  } else if (checkmate) {
    lines.push(`Checkmate Sessions (${checkmate.sessionCount} sessions | ${checkmate.totalTurns} turns):`);
    lines.push(`  Output tok/turn : ${checkmate.avgOutTok} avg | ${checkmate.medOutTok} med`);
    lines.push(`  Tool calls/turn : ${checkmate.avgToolCalls} avg | ${checkmate.medToolCalls} med`);
    lines.push(`  Total tokens    : ${checkmate.totalOutputTokens.toLocaleString()}`);
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
