import { isEmail, hasMinLength, isPositiveInt } from "../validators/common.js";

export function validateSignup(data) {
  const errors = [];
  if (!data || !isEmail(data.email)) errors.push("invalid_email");
  if (!data || !hasMinLength(data.password, 8)) errors.push("short_password");
  if (!data || !isPositiveInt(data.age)) errors.push("invalid_age");
  return errors;
}
