export function buildSummary(rawInput) {
  // Parsing
  const lines = rawInput.trim().split("\n");
  const entries = [];
  for (const l of lines) {
    const [k, v] = l.split(":");
    if (k && v) entries.push({ k: k.trim(), v: Number(v.trim()) });
  }

  // Computing
  let total = 0;
  for (const e of entries) total += e.v;
  const avg = entries.length ? total / entries.length : 0;

  // Formatting
  return "Summary: " + entries.length + " items, Total=" + total + ", Avg=" + avg;
}
