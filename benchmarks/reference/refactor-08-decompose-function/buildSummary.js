function parseData(raw) {
  return raw.trim().split("\n").map(l => {
    const [k, v] = l.split(":");
    return { k: k?.trim(), v: Number(v?.trim() || 0) };
  }).filter(e => e.k);
}

function computeMetrics(entries) {
  const total = entries.reduce((s, e) => s + e.v, 0);
  const avg = entries.length ? total / entries.length : 0;
  return { count: entries.length, total, avg };
}

function formatReport({ count, total, avg }) {
  return `Summary: ${count} items, Total=${total}, Avg=${avg}`;
}

export function buildSummary(rawInput) {
  const entries = parseData(rawInput);
  const metrics = computeMetrics(entries);
  return formatReport(metrics);
}
