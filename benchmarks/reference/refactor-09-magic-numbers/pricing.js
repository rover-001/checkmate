const TAX_RATE = 0.0825;
const DISCOUNT_THRESHOLD = 100;
const DISCOUNT_RATE = 0.05;
const SHIPPING_FEE = 15;

export function calculateTotal(subtotal) {
  let discount = 0;
  if (subtotal > DISCOUNT_THRESHOLD) {
    discount = subtotal * DISCOUNT_RATE;
  }
  const tax = (subtotal - discount) * TAX_RATE;
  return subtotal - discount + tax + SHIPPING_FEE;
}
