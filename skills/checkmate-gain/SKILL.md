---
name: checkmate-gain
description: >-
  Displays the checkmate token and step efficiency scoreboard from benchmark results.
  Activates on "/checkmate-gain", "checkmate gain", "checkmate scoreboard", or "token savings".
allowed-tools: ["Bash(node *gain.mjs*)"]
---

# checkmate-gain

!`node "${CLAUDE_PLUGIN_ROOT}/skills/checkmate-gain/gain.mjs"`

Print the output of the command above verbatim to the user.
If the command was not run automatically via injection, execute `node "${CLAUDE_PLUGIN_ROOT}/skills/checkmate-gain/gain.mjs"` using Bash and output the exact stdout verbatim.
Do not add any preamble, conversational commentary, recap, or markdown formatting.
This skill is read-only: it edits nothing and changes no settings or modes.
