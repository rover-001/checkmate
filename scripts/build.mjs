#!/usr/bin/env node

/**
 * checkmate — Phase 2 Build Script
 * Generates dist/ deterministically & idempotently from rules and skills.
 *
 * Targets:
 * - dist/claude-code/ : Plugin payload (.claude-plugin, hooks, commands, skills, rules)
 * - dist/codex/       : AGENTS.md + skills/checkmate/SKILL.md (@checkmate trigger noted)
 * - dist/opencode/    : .opencode/command/checkmate.md + AGENTS.md instructions
 * - dist/cursor/      : .cursor/rules/checkmate.mdc (alwaysApply: true)
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  readdirSync,
  copyFileSync,
  chmodSync,
  existsSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const DIST_DIR = join(ROOT_DIR, 'dist');

// Read source files
const coreRulesPath = join(ROOT_DIR, 'rules', 'checkmate.md');
if (!existsSync(coreRulesPath)) {
  console.error(`Error: Core rules file missing at ${coreRulesPath}`);
  process.exit(1);
}
const coreRules = readFileSync(coreRulesPath, 'utf8');
const coreRulesTrimmed = coreRules.trim();

// Read modes deltas in stable, sorted order
const modesDir = join(ROOT_DIR, 'rules', 'modes');
const modeFiles = existsSync(modesDir)
  ? readdirSync(modesDir)
      .filter((file) => file.endsWith('.md'))
      .sort((a, b) => a.localeCompare(b))
  : [];
const modeDeltas = {};
for (const file of modeFiles) {
  const modeKey = file.replace(/\.md$/, '');
  modeDeltas[modeKey] = readFileSync(join(modesDir, file), 'utf8').trim();
}

// Read skills in stable, sorted order
const skillsDir = join(ROOT_DIR, 'skills');
const skillDirs = existsSync(skillsDir)
  ? readdirSync(skillsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .sort((a, b) => a.localeCompare(b))
  : [];
const skills = {};
for (const skillName of skillDirs) {
  const skillPath = join(skillsDir, skillName, 'SKILL.md');
  if (existsSync(skillPath)) {
    skills[skillName] = readFileSync(skillPath, 'utf8');
  }
}

// Deterministic recursive directory copy
function copyDirDeterministic(srcDir, destDir) {
  mkdirSync(destDir, { recursive: true });
  const entries = readdirSync(srcDir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  for (const entry of entries) {
    if (entry.name === '.DS_Store' || entry.name === '.gitkeep') {
      continue;
    }
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirDeterministic(srcPath, destPath);
    } else if (entry.isFile()) {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Clean and recreate dist/ deterministically
rmSync(DIST_DIR, { recursive: true, force: true });
mkdirSync(DIST_DIR, { recursive: true });

// Shared Modes section
const modesSection = `## Modes

- **lite**: Rules 1–9, plus one line naming a shorter path if you saw one.
- **full** (default): Rules 1–9 as written.
- **ultra**: Minimum tokens. No commentary except the closing line and unavoidable assumptions. Strictest scope cuts.`;

// 1. dist/claude-code/
const claudeCodeDir = join(DIST_DIR, 'claude-code');
mkdirSync(claudeCodeDir, { recursive: true });

const pluginDirs = ['.claude-plugin', 'hooks', 'commands', 'skills', 'rules'];
for (const dirName of pluginDirs) {
  const src = join(ROOT_DIR, dirName);
  if (existsSync(src)) {
    copyDirDeterministic(src, join(claudeCodeDir, dirName));
  }
}

const claudeHookScript = join(claudeCodeDir, 'hooks', 'checkmate-instructions.js');
if (existsSync(claudeHookScript)) {
  chmodSync(claudeHookScript, 0o755);
}

// 2. dist/codex/
const codexDir = join(DIST_DIR, 'codex');
mkdirSync(codexDir, { recursive: true });

const codexAgentsContent = `<!-- Codex Trigger: Use @checkmate or ask for "checkmate mode" -->

${coreRulesTrimmed}

${modesSection}
`;
writeFileSync(join(codexDir, 'AGENTS.md'), codexAgentsContent, 'utf8');

const codexSkillDir = join(codexDir, 'skills', 'checkmate');
mkdirSync(codexSkillDir, { recursive: true });
const codexSkillContent = `---
name: checkmate
description: >-
  Goal-driven mode for AI coding agents. Trigger with @checkmate, /checkmate,
  "checkmate mode", "be goal driven", "shortest path", "fewest tokens",
  "fewest moves", or "mate in the fewest moves".
  Makes the agent identify the win condition and take the shortest path to it.
---

${coreRulesTrimmed}

${modesSection}

Use \`/checkmate [lite|full|ultra]\` or \`@checkmate [lite|full|ultra]\` to switch modes. Use \`@checkmate off\` or \`/checkmate off\` to disable.
`;
writeFileSync(join(codexSkillDir, 'SKILL.md'), codexSkillContent, 'utf8');

// 3. dist/opencode/
const opencodeDir = join(DIST_DIR, 'opencode');
const opencodeCommandDir = join(opencodeDir, '.opencode', 'command');
const opencodeCommandsDir = join(opencodeDir, '.opencode', 'commands');
mkdirSync(opencodeCommandDir, { recursive: true });
mkdirSync(opencodeCommandsDir, { recursive: true });

const opencodeCommandContent = `---
description: "Goal-driven mode. Reach the user's win condition in the fewest moves. Usage: /checkmate [lite|full|ultra|off]"
---

${coreRulesTrimmed}

${modesSection}
`;
writeFileSync(join(opencodeCommandDir, 'checkmate.md'), opencodeCommandContent, 'utf8');
writeFileSync(join(opencodeCommandsDir, 'checkmate.md'), opencodeCommandContent, 'utf8');

const opencodeAgentsContent = `<!-- OpenCode Instructions: Checkmate Goal-Driven Mode (/checkmate) -->

${coreRulesTrimmed}

${modesSection}

Trigger with \`/checkmate [lite|full|ultra|off]\` or natural language ("checkmate mode", "be goal driven").
`;
writeFileSync(join(opencodeDir, 'AGENTS.md'), opencodeAgentsContent, 'utf8');

// 4. dist/cursor/
const cursorDir = join(DIST_DIR, 'cursor', '.cursor', 'rules');
mkdirSync(cursorDir, { recursive: true });

const cursorMdcContent = `---
description: "Goal-driven mode. Reach the user's win condition in the fewest moves."
globs: ""
alwaysApply: true
---

${coreRulesTrimmed}

${modesSection}
`;
writeFileSync(join(cursorDir, 'checkmate.mdc'), cursorMdcContent, 'utf8');

console.log('Build complete: generated dist/ for claude-code, codex, opencode, cursor.');
