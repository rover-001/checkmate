export function isEmail(val) {
  return typeof val === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val);
}
export function hasMinLength(val, min) {
  return typeof val === "string" && val.length >= min;
}
export function isPositiveInt(val) {
  return Number.isInteger(val) && val > 0;
}
