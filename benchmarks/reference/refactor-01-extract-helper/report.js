function fmtUser(u) {
  const n = u.name ? u.name.trim().toUpperCase() : "ANONYMOUS";
  const b = "$" + (Math.round(u.balance * 100) / 100).toFixed(2);
  const d = u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : "N/A";
  return { n, b, d };
}

export function generateUserReport(user) {
  const { n, b, d } = fmtUser(user);
  return {
    summary: `USER: ${n} | BALANCE: ${b} | SINCE: ${d}`,
    invoice1: `Invoice 1 for ${n}: ${b} generated on ${d}`,
    invoice2: `Invoice 2 for ${n}: ${b} due on ${d}`,
    receipt: `Receipt for ${n}: Total paid ${b} at ${d}`,
    logEntry: `[${d}] ${n} audited with ${b}`,
    auditTotal: 22
  };
}
