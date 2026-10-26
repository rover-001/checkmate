#!/usr/bin/env node

// checkmate — SessionStart hook & CLI mode setter
// Outputs the checkmate rules + mode delta to stdout for context injection.
// Contract: stdout text is injected into the session. Exit 0 always.
//
// Mode resolution: CHECKMATE_DEFAULT_MODE env > session/project state > global state > config file > "full"
// If mode is "off", output nothing and exit 0.
//
// CLI setter:
//   node checkmate-instructions.js --set <lite|full|ultra|off> [--project <path>] [--session <id>] [--global]
// Writes mode to state.json keyed by project directory and session, and prints rules payload (or 'checkmate: off').

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
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

function getProjectDir() {
  const envProj = process.env.CHECKMATE_PROJECT_DIR;
  if (envProj) return resolve(envProj);
  try {
    return resolve(process.cwd());
  } catch {
    return "";
  }
}

function getSessionId() {
  return process.env.CHECKMATE_SESSION_ID || null;
}

function resolveMode() {
  // 1. Env var (highest priority)
  const envMode = process.env.CHECKMATE_DEFAULT_MODE;
  if (envMode && VALID_MODES.includes(envMode.toLowerCase())) {
    return envMode.toLowerCase();
  }

  const projectDir = getProjectDir();
  const sessionId = getSessionId();

  // 2. State file (session or project level)
  try {
    const stateDir =
      process.env.CHECKMATE_STATE_DIR ||
      getDefaultConfigDir();
    const statePath = join(stateDir, "state.json");
    if (existsSync(statePath)) {
      const state = JSON.parse(readFileSync(statePath, "utf8"));
      if (sessionId && state.sessions && state.sessions[sessionId] && VALID_MODES.includes(state.sessions[sessionId])) {
        return state.sessions[sessionId];
      }
      if (projectDir && state.projects && state.projects[projectDir] && VALID_MODES.includes(state.projects[projectDir])) {
        return state.projects[projectDir];
      }
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
      if (projectDir && config.projects && config.projects[projectDir] && VALID_MODES.includes(config.projects[projectDir])) {
        return config.projects[projectDir];
      }
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

    let projectDir = getProjectDir();
    let sessionId = getSessionId();

    const projIdx = process.argv.indexOf("--project");
    if (projIdx !== -1 && process.argv[projIdx + 1]) {
      projectDir = resolve(process.argv[projIdx + 1]);
    }
    const sessIdx = process.argv.indexOf("--session");
    if (sessIdx !== -1 && process.argv[sessIdx + 1]) {
      sessionId = process.argv[sessIdx + 1].trim();
    }

    try {
      const stateDir =
        process.env.CHECKMATE_STATE_DIR ||
        getDefaultConfigDir();
      mkdirSync(stateDir, { recursive: true });
      const statePath = join(stateDir, "state.json");
      let existingState = {};
      try {
        if (existsSync(statePath)) {
          existingState = JSON.parse(readFileSync(statePath, "utf8"));
          if (typeof existingState !== "object" || existingState === null) {
            existingState = {};
          }
        }
      } catch {
        existingState = {};
      }

      const projects = typeof existingState.projects === "object" && existingState.projects !== null
        ? { ...existingState.projects }
        : {};
      if (projectDir) {
        projects[projectDir] = targetMode;
      }

      const sessions = typeof existingState.sessions === "object" && existingState.sessions !== null
        ? { ...existingState.sessions }
        : {};
      if (sessionId) {
        sessions[sessionId] = targetMode;
      }

      const newState = {
        ...existingState,
        mode: targetMode,
        projects,
        sessions,
      };

      writeFileSync(
        statePath,
        JSON.stringify(newState, null, 2) + "\n",
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
