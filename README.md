<div align="center">
  <a href="https://github.com/rover-001/checkmate">
    <img src="assets/logo.svg" alt="checkmate logo" width="100%" />
  </a>

  # checkmate

  **Mate in the fewest moves.**

  *Goal-driven mode for AI coding agents. Reach the user's win condition in the fewest steps and lowest token count.*

  <p>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
    <a href="package.json"><img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg" alt="Node.js >= 20.0.0" /></a>
    <a href="tests/"><img src="https://img.shields.io/badge/tests-85%20passed-success.svg" alt="Tests" /></a>
    <a href="package.json"><img src="https://img.shields.io/badge/dependencies-0-success.svg" alt="Zero Dependencies" /></a>
  </p>
</div>

---

## What is checkmate?

**checkmate** gives AI coding agents a relentless, goal-driven personality. Instead of generating conversational filler, presenting menus of hypothetical options, or introducing speculative abstractions, checkmate guides the agent to:

1. **Identify the win condition** silently before taking action.
2. **Take the shortest path** that completely satisfies the goal.
3. **Spend the fewest tokens**—no preambles, recaps, or unrequested closing offers.
4. **Verify the solution** against actual requirements and tests before declaring done.

---

## Before & After

Here is the difference checkmate makes on a typical coding task:

> **Prompt:** *"Add a function `slugify(text)` in `src/utils.js` that converts strings to URL-friendly slugs."*

### Without checkmate (Standard AI Agent)
```text
Certainly! I would be delighted to help you implement a URL-friendly slug generator.

There are several standard ways we could design this function depending on your needs:
1. Basic Regex approach (fast, ASCII-only)
2. Unicode Normalization approach (handles accents and umlauts via NFKD)
3. External dependency approach (e.g. using @sindresorhus/slugify)
4. Comprehensive slug options configuration (custom delimiters, casing, trim)

I have gone ahead and created a flexible `SlugService` class in `src/slug-service.js` along with
a configuration interface in `src/slug-config.json` so you can customize delimiters and casing.
I also created a test suite in `tests/slug.test.js` and added docs in `docs/slugify.md`.

Here is the code... [150 lines of boilerplate, interfaces, and unused options]

Summary of changes:
- Created SlugService with 4 configurable options
- Exported helper utility in src/utils.js
- Added configuration defaults

Would you like me to write more tests, add Unicode transliteration tables, or integrate
this with your routing framework? Let me know how you would like to proceed!
```
*Result:* ~850 output tokens, 4 unrequested files, option menu paralysis, unverified assumptions.

### With checkmate
```javascript
// src/utils.js
export function slugify(text) {
  return String(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```
```bash
node -e "import { slugify } from './src/utils.js'; console.assert(slugify('Hello World!') === 'hello-world');"
```
```text
done
```
*Result:* ~120 output tokens, 1 target file modified, zero conversational fluff, verified against the goal.

---

## Multi-Agent Installation

checkmate is designed as a single source of truth (`rules/checkmate.md`) with deterministic build generators for all major coding agent platforms.

### 1. Claude Code

#### From Marketplace
```bash
/plugin install checkmate --marketplace rover-001/checkmate
```

#### From Local Directory
```bash
# Add as a persistent plugin:
claude plugin add /path/to/checkmate

# Or load directly for a session:
claude --plugin-dir /path/to/checkmate
```

### 2. Cursor

Cursor rules are pre-built at `dist/cursor/.cursor/rules/checkmate.mdc` with `alwaysApply: true`.

```bash
# Copy into your repository rules:
mkdir -p .cursor/rules
cp dist/cursor/.cursor/rules/checkmate.mdc .cursor/rules/checkmate.mdc
```

### 3. OpenCode

OpenCode command templates and instructions are pre-built at `dist/opencode/`.

```bash
# Copy OpenCode commands and root instructions:
cp -r dist/opencode/.opencode .
cp dist/opencode/AGENTS.md .
```

### 4. Codex

Codex agent instructions and companion skills are pre-built at `dist/codex/`.

```bash
# Copy instructions to your workspace root:
cp dist/codex/AGENTS.md .
```
Trigger checkmate in Codex prompts with `@checkmate` or natural language (*"checkmate mode"*).

---

## Usage

When installed in Claude Code, checkmate activates **automatically** via the `SessionStart` hook.

### Modes

| Mode | Intensity & Behavior |
| :--- | :--- |
| **`lite`** | Rules 1–9, plus exactly one line naming a shorter path if you observed one. |
| **`full`** *(default)* | Rules 1–9 as written. Direct, goal-driven, and concise. |
| **`ultra`** | Minimum tokens. Zero commentary except the closing line and unavoidable assumptions. Strictest scope cuts. |
| **`off`** | Disables checkmate rules completely; restores normal agent behavior. |

### Commands

- `/checkmate` — Activate checkmate with default mode (`full`).
- `/checkmate lite` — Switch to `lite` intensity.
- `/checkmate full` — Switch to `full` intensity.
- `/checkmate ultra` — Switch to `ultra` intensity.
- `/checkmate off` — Turn off checkmate for the session.

#### Natural Language Off Switch
You can also disable checkmate at any time in natural conversation by saying:
- *"stop checkmate"*
- *"normal mode"*

---

## Configuration & Precedence

Checkmate determines its active mode using the following strict precedence hierarchy:

```
CHECKMATE_DEFAULT_MODE (environment variable)
  ↳ ~/.config/checkmate/state.json (session / CLI state)
      ↳ ~/.config/checkmate/config.json (user configuration)
          ↳ full (built-in default)
```

### Configuration File Paths

| OS | Configuration File | State File |
| :--- | :--- | :--- |
| **Linux / macOS** | `~/.config/checkmate/config.json` | `~/.config/checkmate/state.json` |
| **Windows** | `%APPDATA%\checkmate\config.json` | `%APPDATA%\checkmate\state.json` |

#### Example `config.json`
```json
{
  "defaultMode": "ultra"
}
```

#### Environment Variable Override
```bash
export CHECKMATE_DEFAULT_MODE=ultra
```

---

## Sibling Skills

In addition to core goal-driven execution, checkmate includes three companion skills:

### 1. `checkmate-review`
Audits a diff, file, or prior agent response for detours, scope creep, and token waste.
- **Trigger:** `/checkmate-review [file/diff]` or *"review for detours"*
- **Taxonomy:** Emits structured findings (`scope-creep`, `abstraction`, `option-menu`, `preamble`, `recap`, `premature-complexity`, `unverified`).
- **Verdict:** Ends with `verdict: clean` or `verdict: N findings`. Read-only; edits nothing.

### 2. `checkmate-help`
Displays a quick reference card summarizing modes, commands, configuration paths, and precedence rules.
- **Trigger:** `/checkmate-help` or *"checkmate help"*
- **Scope:** One-shot informational display; does not alter state.

### 3. `checkmate-gain`
Displays the efficiency scoreboard comparing checkmate against the unassisted baseline.
- **Trigger:** `/checkmate-gain` or *"checkmate gain"*
- **Output:** Reports goal-pass rate, median output tokens, median total tokens, and step reductions directly from benchmark data. Read-only.

---

## How It Works

A `SKILL.md` file alone does not reliably activate in modern AI agents. Independent benchmarks (such as JetBrains' study of agent behavior) revealed that agents rarely self-invoke skill definitions unprompted.

checkmate guarantees activation through a native **`SessionStart` hook** (`hooks/checkmate-instructions.js`):
1. Runs instantaneously (<5ms script logic) on session startup and resume.
2. Resolves the active mode across environment variables, state files, and user config.
3. If mode is `off`, outputs nothing and exits cleanly.
4. Otherwise, injects the core rules plus the selected mode delta directly into the agent's context.
5. All operations are local, zero-dependency, and safe against crashes (fails closed silently).

---

## The 9 Rules

<details>
<summary><b>Click to expand canonical rules (rules/checkmate.md)</b></summary>

```markdown
# checkmate

Goal-driven mode. Reach the user's win condition in the fewest moves.

1. GOAL. Before acting, identify the win condition: what must be true when this is done. Do this silently. State it only if ambiguous.
2. SHORTEST PATH. Choose the least complex solution that fully meets the goal. No extra features, abstractions, config, or options nobody asked for.
3. TOKENS. Answer first. No preamble, no restating the question, no recap, no closing offers. Stop when the goal is met.
4. DECIDE. Pick one approach. If a tradeoff matters, state it in one line. Never present a menu unless asked.
5. ASK RARELY. Ask only when blocked and no safe assumption exists. One question max. Otherwise state the assumption in one line and proceed.
6. FINISH. Partial work is not done. Continue until the goal is met or a real blocker exists. Do not stop to ask permission for obvious next steps.
7. VERIFY. Before declaring done, check the result against the goal (run it, test it, re-read the requirement), not against how it looks. When writing tests, verify actual behavioral logic and state transitions—never write superficial assertions that merely check prompt text, log strings, or mock return values.
8. EARN COMPLEXITY. Add complexity only when a concrete failure or stated requirement forces it. Say which.
9. CLOSE. Last line: done, not done: <why>, or blocked: <what's needed>.

Off switch: if the user says "stop checkmate" or "normal mode", stop applying these rules.

Overrides: safety, correctness, and explicit user requests (e.g. "explain in detail") always win over brevity.
```

</details>

---

## Benchmark Results

checkmate is rigorously evaluated across a 40-task benchmark suite spanning 4 distinct categories:
- **`feature`**: Implementation tasks verified by hidden automated unit tests.
- **`bugfix`**: Real-world bug repros with failing tests that must be made green.
- **`refactor`**: Code refactoring under strict invariant preservation and structural constraints.
- **`qa`**: Precise technical queries with exact checkable answers.

### Integrity & Measurement Principles
- **Pass rate first, tokens second**: An agent that fails quickly is not efficient; it is broken. Pass rate is the primary metric.
- **Conditioned on success**: Token, step, and wall-clock medians and IQRs are computed **strictly among passed runs**. Failures cannot "win" on brevity.
- **Honest reporting**: No unmeasured claims or fabricated percentages.

<!-- results:start -->

*Benchmark summary generated at 2026-10-24T15:59:32.863Z using model `claude-opus-5-5` (3 run(s)/task).*

| Scope | Arm | Runs | Passed | Pass Rate | Uncached In | Cache Read | Output | Total Tokens | Steps | Wall |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Overall** | `baseline` | 120 | 104 | **86.7%** | 3920.5 [2583–5193] | 45724 [10784–51405] | 562.5 [146–671] | 53828 | 4 | 6.48s |
| **Overall** | `checkmate` | 120 | 118 | **98.3%** | 2431.5 [2107–3325] | 37184 [11131–42441] | 274 [22–331] | 42897.5 | 2 | 3.79s |
| **Overall** | `ultra` | 120 | 115 | **95.8%** | 2380 [2121–2842] | 34300 [11147–36747] | 203 [11–240] | 39090 | 2 | 3.08s |
| **Shared Intersection** | `baseline` | 63 | 63 | **100.0%** | 3624 [2400–5166] | 48154 [10494–50980] | 562 [133–665] | 56752 | 4 | 6.45s |
| **Shared Intersection** | `checkmate` | 63 | 63 | **100.0%** | 2422 [2107–3117] | 38283 [10663–39833] | 278 [19–328] | 44614 | 2 | 3.69s |
| **Shared Intersection** | `ultra` | 63 | 63 | **100.0%** | 2380 [2083–2807] | 35291 [10736–36600] | 204 [9–236] | 41145 | 2 | 3.06s |
| Feature | `baseline` | 30 | 25 | 83.3% | 5166 [3831–7754] | 57020 [55298.5–57624] | 755 [701.5–818.5] | 65590 | 5 | 9.18s |
| Feature | `checkmate` | 30 | 30 | 100.0% | 2899.5 [2133–3440] | 43252.5 [42805–43910] | 367 [341–390] | 49138 | 3 | 4.99s |
| Feature | `ultra` | 30 | 28 | 93.3% | 2563.5 [2314.5–2884.5] | 39803 [39447.5–40073.5] | 273 [262–286.5] | 45276 | 2 | 4.25s |
| Bugfix | `baseline` | 30 | 24 | 80.0% | 4341.5 [3530.5–5244] | 42252 [41668–42764] | 515.5 [484.5–549] | 49732.5 | 4 | 5.96s |
| Bugfix | `checkmate` | 30 | 29 | 96.7% | 2475 [2109.5–3564] | 35623 [34523–35994.5] | 244 [225.5–269] | 40928 | 2 | 3.43s |
| Bugfix | `ultra` | 30 | 29 | 96.7% | 2685 [2198–2991.5] | 33337 [32950.5–33945] | 192 [174.5–202.5] | 38920 | 2 | 2.91s |
| Refactor | `baseline` | 30 | 27 | 90.0% | 4526 [3691–6450] | 50180 [48705–50629] | 624 [589–665] | 57984 | 4 | 7.22s |
| Refactor | `checkmate` | 30 | 29 | 96.7% | 3060 [2145–3437] | 38956 [38603.5–39817.5] | 308 [280–322] | 45004 | 3 | 4.12s |
| Refactor | `ultra` | 30 | 29 | 96.7% | 2581 [2227.5–2883] | 35953 [35588–36383] | 218 [205.5–229] | 41398 | 2 | 3.30s |
| Qa | `baseline` | 30 | 28 | 93.3% | 2333.5 [2097–2631] | 10111 [9615–10505] | 121.5 [110–136.5] | 15121.5 | 1 | 1.91s |
| Qa | `checkmate` | 30 | 30 | 100.0% | 2198 [2035–2324] | 10347.5 [10078–10696] | 18 [15–19] | 15218 | 1 | 1.43s |
| Qa | `ultra` | 30 | 29 | 96.7% | 2199 [2058–2312] | 10445 [10202.5–10747] | 8 [7–9] | 15308 | 1 | 1.20s |

### Shared Task Intersection (All Arms Passed)

*Paired comparison across 21 task(s) where all evaluated arms passed 100% of runs (eliminating survivorship bias).*

| Arm | Shared Tasks | Pass Rate | Uncached In | Cache Read | Output | Total Tokens | Steps | Wall |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `baseline` | 21 | 100.0% | 3624 [2400–5166] | 48154 [10494–50980] | 562 [133–665] | 56752 | 4 | 6.45s |
| `checkmate` | 21 | 100.0% | 2422 [2107–3117] | 38283 [10663–39833] | 278 [19–328] | 44614 | 2 | 3.69s |
| `ultra` | 21 | 100.0% | 2380 [2083–2807] | 35291 [10736–36600] | 204 [9–236] | 41145 | 2 | 3.06s |

<!-- results:end -->

---

## Relationship to ponytail

checkmate is inspired by [ponytail](https://github.com/DietrichGebert/ponytail) (the "lazy senior dev" skill). Key differences:

| Metric / Dimension | ponytail | checkmate |
| :--- | :--- | :--- |
| **Primary Optimization** | Amount of code written | Number of moves to reach the goal |
| **Behavioral Scope** | Code authoring | Whole agent lifecycle: code, debugging, planning, Q&A |
| **Success Metric** | Less code (lines of code) | Goal-pass rate at minimum tokens & steps |
| **Architecture** | Python / Shell dependencies | Zero external npm dependencies (Node.js ESM) |

---

## Contributing

Contributions are welcome! Please ensure that all changes adhere to checkmate's design constraints:
1. **Zero external runtime dependencies**: Keep hooks and utilities lightweight and native.
2. **Byte budget**: Injected rules must remain under 2 KB.
3. **Idempotent builds**: `npm run build` must produce deterministic distributions across all agent platforms.
4. **All tests pass**: Run `npm test` (including behavior scenarios B1–B9 and stats verification).

```bash
git clone https://github.com/rover-001/checkmate.git
cd checkmate
npm test
npm run build
```

---

## License

[MIT](LICENSE) © Parth Sharma
