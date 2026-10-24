export function processOrder(order) {
  if (order) {
    if (order.id) {
      if (order.items && order.items.length > 0) {
        if (order.paid) {
          return "PROCESSED";
        } else {
          return "UNPAID";
        }
      } else {
        return "EMPTY";
      }
    } else {
      return "INVALID_ID";
    }
  } else {
    return "NO_ORDER";
  }
}
