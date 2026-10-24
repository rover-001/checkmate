---
name: checkmate-help
description: >-
  Displays the checkmate reference card with modes, commands, configuration paths,
  and precedence rules. Activates on "/checkmate-help", "checkmate help", or "how to use checkmate".
---

# checkmate — Quick Reference Card

*Goal-driven mode: reach the user's win condition in the fewest moves.*
*(Note: this is a one-shot informational reference card, not a persistent mode.)*

---

## Modes

| Mode | Intensity & Behavior |
| :--- | :--- |
| **`lite`** | Rules 1–9, plus one line naming a shorter path if you saw one. |
| **`full`** *(default)* | Rules 1–9 as written. Direct, goal-driven, concise. |
| **`ultra`** | Minimum tokens. No commentary except closing line and unavoidable assumptions. Strictest scope cuts. |
| **`off`** | Disables checkmate rules completely; restores normal agent behavior. |

---

## Commands & Triggers

- `/checkmate [lite|full|ultra]` — Switch to specified checkmate mode.
- `/checkmate off` — Turn off checkmate.
- **Natural language off switches**: `"stop checkmate"` or `"normal mode"` immediately deactivate checkmate.
- `/checkmate-review [target]` — Read-only audit of a diff, file, or response for detours, scope creep, and token waste.
- `/checkmate-gain` — Print the token and step savings scoreboard from benchmark results.
- `/checkmate-help` — Display this reference card.

---

## Configuration & State

Checkmate resolves its active mode using the following precedence:

```
CHECKMATE_DEFAULT_MODE (env)  >  state.json  >  config.json  >  full (default)
```

1. **Environment Variable**: `CHECKMATE_DEFAULT_MODE` (e.g. `export CHECKMATE_DEFAULT_MODE=ultra`). Highest priority.
2. **State File**: `~/.config/checkmate/state.json` (Windows: `%APPDATA%\checkmate\state.json`). Written automatically when you run `/checkmate [mode]`. Persists session mode choices. Shape: `{"mode": "full"}`.
3. **Config File**: `~/.config/checkmate/config.json` (Windows: `%APPDATA%\checkmate\config.json`). User base preference. Shape: `{"defaultMode": "full"}`.
4. **Fallback Default**: `full`.

---

## How to Disable

To turn off checkmate at any time, use any of:
- Command: `/checkmate off`
- Natural language: say `"stop checkmate"` or `"normal mode"`
- Environment: set `CHECKMATE_DEFAULT_MODE=off`
- Config: set `"defaultMode": "off"` in `~/.config/checkmate/config.json`
