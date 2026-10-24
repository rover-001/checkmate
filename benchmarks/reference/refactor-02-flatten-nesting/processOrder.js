export function processOrder(order) {
  if (!order) return "NO_ORDER";
  if (!order.id) return "INVALID_ID";
  if (!order.items || order.items.length === 0) return "EMPTY";
  if (!order.paid) return "UNPAID";
  return "PROCESSED";
}
