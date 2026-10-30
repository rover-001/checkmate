# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-10-30

### Added
- **5th Benchmark Category (`integrate`)**: Added 8 multi-file codebase integration tasks (`integrate-01` through `integrate-08`) testing that agents reuse existing helpers and design patterns rather than introducing unneeded layers or duplicating code. Hidden tests assert functional correctness and strictly fail if logic is duplicated or unnecessary wrapper classes are declared.
- **Multi-Model Benchmark Coverage**: Expanded benchmark suite to 48 tasks (144 runs/arm, 432 runs/model). Ran full evaluations across both Sonnet-class (`claude-sonnet-5-5`) and Opus-class (`claude-opus-5-5`) models across all 3 arms (`baseline`, `checkmate`, `ultra`). Saved per-model results into dedicated separate files (`summary-claude-sonnet-5-5.json`, `summary-claude-opus-5-5.json`, and raw jsonl logs).
- **Environment Variable Model Configuration**: `benchmarks/run.mjs` and `benchmarks/generate-eval.mjs` now support `MODEL`, `ANTHROPIC_MODEL`, and `CHECKMATE_BENCHMARK_MODEL` environment variables in addition to the `--model` flag.
- **Failure Breakdown Classification**: Implemented `classifyFailure` and `computeFailureBreakdown` in `benchmarks/stats.mjs`, categorizing every failed run in `checkmate` and `ultra` arms into five root causes (`skipped verification`, `partial change`, `wrong output`, `timeout`, `other`) based on actual run logs and test outputs. Emits per-arm breakdown tables and lists failing task IDs in `README.md`, `summary.json`, and `checkmate-gain`.
- **Dual-View Reporting in `/checkmate-gain`**: Added the Shared-Set view to `skills/checkmate-gain/gain.mjs`, showing both the standard Overall view (per-arm passed runs) and the identical Shared-Set view (tasks where all arms passed in all runs) with output tokens, total tokens, steps, and wall time.

### Already Present / Preserved
- **CLI Model Flag**: `--model <model>` argument was already present in `benchmarks/run.mjs`.
- **Paired Intersection Algorithm**: Strict task intersection logic was already implemented in `benchmarks/stats.mjs` (`computeIntersectionStats`).
- **Markdown Summary Harness**: Automated report insertion markers (`<!-- results:start -->` / `<!-- results:end -->`) and script (`scripts/report.mjs`) were already present.
- **Rule Constraints**: Injected rules (`rules/checkmate.md`) preserved under the 2 KB budget (1,814 bytes) with zero changes to canonical wording.

## [2.0.0] - 2026-10-30

### Added
- **Architectural & Holistic Engineering Manifesto**: Directly addressed community feedback regarding agent "corner cutting" and "rooms in a field" design anti-patterns. Clarified how Checkmate enforces deep codebase integration, root-cause resolution, and whole-system harmony over superficial fixes.
- **Doc-First & Spec Synergy Documentation**: Detailed the execution blueprint model where Checkmate acts as the high-velocity execution engine for doc-first specifications, RFCs, and PRDs without permission-seeking stalls or option-menu paralysis.
- **Mode Selection Framework**: Comprehensive breakdown of `full` vs `lite` vs `ultra`, including the behavioral and pass-rate tradeoffs on multi-step tasks (answering why Full achieves 98.3% pass rate vs Ultra's 95.8%).
- **Rigorous Benchmark Methodology**: Fully documented the Paired Shared Task Intersection (21 tasks passed by 100% of arms, eliminating survivorship bias), demonstrating a 51% output token reduction and 50% step cut on identical complex tasks.
- **Real-World Transcript Telemetry in `checkmate-gain`**: Integrated live session analysis (`~/.claude/projects/*/*.jsonl`) measuring real-world turns, output tokens/turn, tool calls/turn, and comparative deltas between Checkmate and baseline sessions.
- **Safety Invariant Enforcement**: Mandated explicit user confirmations in Rule 6 and Overrides for all outward-facing or hard-to-undo actions (git push, deploy, publish, send, delete, public-facing copy).
- **101 Acceptance & Behavior Tests**: Expanded test suite to 101 tests verifying core rules, multi-agent builds, gain telemetry, hook precedence, and edge cases.

### Changed
- **Synchronized Canonical Rules**: Updated documentation to match canonical `rules/checkmate.md` with explicit outward-facing exemptions, behavioral test requirements, and `done, unverified: <what>` states.
- **Version Synchronized**: Bumper version to 2.0.0 across `package.json`, `.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json`.

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
