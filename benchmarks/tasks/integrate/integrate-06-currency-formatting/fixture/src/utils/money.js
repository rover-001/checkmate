export function formatCents(cents, currency = "USD") {
  const dollars = (cents / 100).toFixed(2);
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : "";
  return `${sym}${dollars}`;
}
