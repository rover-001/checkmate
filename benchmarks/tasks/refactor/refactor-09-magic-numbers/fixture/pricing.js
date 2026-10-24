export function calculateTotal(subtotal) {
  let discount = 0;
  if (subtotal > 100) {
    discount = subtotal * 0.05;
  }
  const tax = (subtotal - discount) * 0.0825;
  const shipping = 15;
  return subtotal - discount + tax + shipping;
}
