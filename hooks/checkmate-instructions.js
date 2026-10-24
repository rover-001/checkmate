#!/usr/bin/env node

// checkmate — SessionStart hook & CLI mode setter
// Outputs the checkmate rules + mode delta to stdout for context injection.
// Contract: stdout text is injected into the session. Exit 0 always.
//
// Mode resolution: CHECKMATE_DEFAULT_MODE env > state file > config file > "full"
// If mode is "off", output nothing and exit 0.
//
// CLI setter:
//   node checkmate-instructions.js --set <lite|full|ultra|off>
// Writes {"mode": ...} to state.json and prints mode rules payload (or 'checkmate: off').

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || join(__dirname, "..");

const VALID_MODES = ["lite", "full", "ultra", "off"];

function getDefaultConfigDir() {
  if (process.platform === "win32" && process.env.APPDATA) {
    return join(process.env.APPDATA, "checkmate");
  }
  return join(homedir(), ".config", "checkmate");
}

function resolveMode() {
  // 1. Env var (highest priority)
  const envMode = process.env.CHECKMATE_DEFAULT_MODE;
  if (envMode && VALID_MODES.includes(envMode.toLowerCase())) {
    return envMode.toLowerCase();
  }

  // 2. State file (set by /checkmate command for session persistence)
  try {
    const stateDir =
      process.env.CHECKMATE_STATE_DIR ||
      getDefaultConfigDir();
    const statePath = join(stateDir, "state.json");
    if (existsSync(statePath)) {
      const state = JSON.parse(readFileSync(statePath, "utf8"));
      if (state.mode && VALID_MODES.includes(state.mode)) {
        return state.mode;
      }
    }
  } catch {
    // Corrupt state file — ignore silently
  }

  // 3. Config file
  try {
    const configDir =
      process.env.CHECKMATE_CONFIG_DIR ||
      getDefaultConfigDir();
    const configPath = join(configDir, "config.json");
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, "utf8"));
      if (config.defaultMode && VALID_MODES.includes(config.defaultMode)) {
        return config.defaultMode;
      }
    }
  } catch {
    // Corrupt config — ignore silently
  }

  // 4. Default
  return "full";
}

function readRuleFile(path) {
  try {
    return readFileSync(path, "utf8").trim();
  } catch {
    return "";
  }
}

function printPayload(mode) {
  if (mode === "off") {
    process.exit(0);
  }

  const coreRules = readRuleFile(join(PLUGIN_ROOT, "rules", "checkmate.md"));
  const modeDelta = readRuleFile(
    join(PLUGIN_ROOT, "rules", "modes", `${mode}.md`)
  );

  if (!coreRules) {
    process.exit(0);
  }

  let output = coreRules;
  if (modeDelta) {
    output += "\n\n" + modeDelta;
  }

  process.stdout.write(output + "\n");
  process.exit(0);
}

try {
  const setIndex = process.argv.indexOf("--set");
  if (setIndex !== -1) {
    let rawArg = process.argv[setIndex + 1];
    let targetMode = "full";
    if (rawArg) {
      const cleaned = rawArg.trim().toLowerCase();
      if (VALID_MODES.includes(cleaned)) {
        targetMode = cleaned;
      } else {
        const firstWord = cleaned.split(/\s+/)[0];
        if (VALID_MODES.includes(firstWord)) {
          targetMode = firstWord;
        }
      }
    }

    try {
      const stateDir =
        process.env.CHECKMATE_STATE_DIR ||
        getDefaultConfigDir();
      mkdirSync(stateDir, { recursive: true });
      const statePath = join(stateDir, "state.json");
      writeFileSync(
        statePath,
        JSON.stringify({ mode: targetMode }, null, 2) + "\n",
        "utf8"
      );
    } catch {
      // Never throw
    }

    if (targetMode === "off") {
      process.stdout.write("checkmate: off\n");
      process.exit(0);
    }

    printPayload(targetMode);
  } else {
    const mode = resolveMode();
    printPayload(mode);
  }
} catch {
  // Never throw — always exit 0
  process.exit(0);
}
