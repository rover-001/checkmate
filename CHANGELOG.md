# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.2] - 2026-10-28

### Fixed
- **Session Classifier**: `checkmate-gain` counts a transcript as a checkmate session only when a successful SessionStart hook attachment carries the injected checkmate rules, ignoring other plugins' SessionStart hooks. Diffs and file reads of `rules/checkmate.md` no longer misclassify sessions.
- **Skipped-Test Test Coverage**: Added B7 behavioral coverage for `skipped 0`, `10 passing`, `10 passed, 3 skipped`, and `no tests ran`.

## [1.2.1] - 2026-10-26

### Fixed
- **Project Mode Isolation**: CLI `--set <mode>` now leaves top-level fallback `mode` untouched unless `--global` is explicitly supplied, strictly isolating modes across parallel repository checkouts.
- **Hook Stdin Support**: SessionStart hook now parses Claude Code's piped stdin JSON (`session_id`, `cwd`), enabling per-session resolution without relying solely on environment variables.
- **Session Analyzer Deduplication & Comparison**: `checkmate-gain` now groups records by `message.id` to prevent multi-block token and turn inflation, and splits disk transcripts into Checkmate vs Baseline sessions to report genuine comparative deltas.
- **Realistic Benchmark Isolation & Style**: Scoped realistic fixtures strictly to `arm.startsWith("realistic")` so baseline/checkmate arms remain pure controls; loaded `.claude/settings.json` with `outputStyle: "concise"` and comprehensive guidelines to benchmark against real-world concise configurations.
- **Rule 6, 7 & 9 Alignments**: Updated Rule 6 to explicitly exclude outward-facing actions; added `done, unverified: <what>` closing state to Rule 9; replaced rule-text regex assertions with stateful behavioral tests for exit codes and skipped test suites.

## [1.2.0] - 2026-10-26

### Added
- **Real Session Telemetry**: `checkmate-gain` now measures live session transcripts (`~/.claude/projects/*/*.jsonl`), reporting turns, tool calls/turn, output tokens/turn, command repetition frequencies, and token concentration in long sessions alongside benchmark numbers (or via `--sessions`).
- **Claude Marketplace Manifest**: Added `.claude-plugin/marketplace.json` enabling direct installation via `/plugin install checkmate --marketplace rover-001/checkmate`.
- **Realistic Context Benchmark Arm**: Added `--realistic` benchmark arm with representative `CLAUDE.md` and concise guidance (`realistic-baseline` vs `realistic-checkmate`) and `--setting-sources` configuration.
- **Per-Project & Per-Session State Isolation**: Hook mode resolution and `/checkmate` CLI now isolate state per project directory and session ID in `state.json`, preventing machine-wide mode bleeding across parallel repos.

### Changed
- **Rule 6 & Overrides Outward-Facing Exemption**: Explicit confirmation required before irreversible or machine-leaving actions: push, deploy, publish, send, delete, or public-facing text edits.
- **Rule 7 Evidence Verification**: Mandatory inspection of actual commands run and exit codes rather than superficial claims or pipelined output tails; skipped tests explicitly fail pass criteria.
- **Command Security**: Quoted `$ARGUMENTS` and scoped `allowed-tools` to `Bash(node *checkmate-instructions.js*)` in `commands/checkmate.md`.
- **Plugin Version**: Synchronized plugin manifest version to 1.2.0 across `package.json`, `plugin.json`, and `marketplace.json`.

## [1.1.0] - 2026-10-24

### Changed
- **Rule 7 Refinement**: Strict behavioral testing requirements; disallowing shallow string/prompt assertions.
- **Benchmark Telemetry**: Uncached input, cache-read, and output token breakdown; paired intersection comparisons across arms to eliminate survivorship bias.
- **Build Sync**: Synchronized across Cursor, OpenCode, Codex, and Claude Code.

## [1.0.0] - 2026-10-24

### Added
- **Core Rules**: Canonical 9 rules in `rules/checkmate.md` targeting win condition identification, minimal output tokens, shortest path execution, and rigorous verification.
- **Mode Intensities**: `lite` (adds observation on shorter paths), `full` (default goal-driven behavior), `ultra` (maximum brevity and scope reduction), and `off` (full deactivation).
- **SessionStart Hook**: Native Node.js ESM hook (`hooks/checkmate-instructions.js`) injecting rules on session start and resume. Fails closed silently with zero runtime dependencies.
- **Cross-Platform Configuration**: Support for environment variable overrides (`CHECKMATE_DEFAULT_MODE`), persistent CLI state (`state.json`), and user configuration files (`config.json`) across Linux/macOS (`~/.config/checkmate/`) and Windows (`%APPDATA%\checkmate\`).
- **Sibling Skills**:
  - `checkmate-review`: Audits diffs, files, and agent responses for detours and scope creep (`scope-creep`, `abstraction`, `option-menu`, `preamble`, `recap`, `premature-complexity`, `unverified`).
  - `checkmate-help`: One-shot reference card displaying modes, commands, file paths, and precedence rules.
  - `checkmate-gain`: Reads benchmark data and prints a compact efficiency scoreboard showing pass-rate, token deltas, and step reductions.
- **Multi-Agent Build System**: `scripts/build.mjs` generates deterministic, idempotent distribution payloads in `dist/` for Claude Code plugin, Cursor (`.cursor/rules/checkmate.mdc`), OpenCode (`.opencode/command/`), and Codex (`AGENTS.md`).
- **40-Task Benchmark Suite**: Comprehensive benchmark harness in `benchmarks/` covering 4 categories (`feature`, `bugfix`, `refactor`, `qa`) with automated pass/fail checks conditioned on success.
- **Behavior Acceptance Suite**: Comprehensive unit tests in `tests/behavior.test.mjs` verifying scenarios B1 through B9.
