---
description: "Set checkmate mode. Usage: /checkmate [lite|full|ultra|off]. Controls goal-driven behavior intensity."
argument-hint: "[lite|full|ultra|off]"
allowed-tools: ["Bash(node *checkmate-instructions.js*)"]
---

!`node "${CLAUDE_PLUGIN_ROOT}/hooks/checkmate-instructions.js" --set "$ARGUMENTS"`

If off, stop applying checkmate rules and reply 'checkmate: off'. Otherwise apply the printed rules for the rest of the session and reply 'checkmate: <mode>'.
