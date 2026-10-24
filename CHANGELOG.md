# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
