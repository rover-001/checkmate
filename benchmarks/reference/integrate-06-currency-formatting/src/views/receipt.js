import { formatCents } from "../utils/money.js";

export function generateReceipt(items) {
  const lines = [];
  let total = 0;
  for (const item of items) {
    total += item.cents;
    lines.push(`${item.name}: ${formatCents(item.cents)}`);
  }
  lines.push(`Total: ${formatCents(total)}`);
  return lines.join("\n");
}
