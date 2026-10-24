---
name: checkmate-review
description: >-
  Audits a diff, file, or last response for detours, scope creep, and token waste.
  Activates on "/checkmate-review", "review for detours", "checkmate review".
allowed-tools: ["Read"]
---

# checkmate-review

Read-only audit of a diff, file, or agent response for detours, unnecessary complexity, and token waste. Edits nothing.

## Tag Glossary

- `scope-creep`: Unrequested features, files, dependencies, or changes beyond the user's stated win condition.
- `abstraction`: Unnecessary interfaces, base classes, helper layers, factory patterns, or indirection when direct code suffices.
- `option-menu`: Presenting a menu of alternatives or asking the user to choose instead of deciding on the shortest path.
- `preamble`: Conversational pleasantries, greetings, restating the prompt, or throat-clearing before the answer.
- `recap`: Summarizing what was just done, restating changes, or unsolicited closing offers/follow-ups ("Let me know if...").
- `premature-complexity`: Speculative configurations, premature generalizations, error hierarchies, or defensive layers without current requirement.
- `unverified`: Claiming a fix or feature works without running/testing it, or asserting an outcome that was not verified against the goal.

## Instructions

1. If a path is provided in arguments (e.g. `/checkmate-review <path>`), read that file. If no path is given, audit the previous agent response or current git diff.
2. Examine the content line by line for detours matching the tags above.
3. Output format:
   - Exactly one line per finding: `L<line>: <tag>: <reason>`
     - `<line>` is the 1-based line number in the target file/diff/response where the detour occurs.
     - `<tag>` must be one of: `scope-creep`, `abstraction`, `option-menu`, `preamble`, `recap`, `premature-complexity`, `unverified`.
     - `<reason>` is a concise explanation of the violation.
   - The final line MUST be either:
     - `verdict: clean` (if 0 findings)
     - `verdict: N findings` (where N is the integer count of findings)
4. Do NOT output any conversational preamble, intro text, markdown code blocks, or post-review recap. Output ONLY the findings lines and verdict line.
