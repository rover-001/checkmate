function isNonEmptyString(val) {
  return typeof val === "string" && val.trim().length > 0;
}

export function validateUsername(u) {
  return isNonEmptyString(u) && u.length >= 3;
}

export function validateEmail(e) {
  return isNonEmptyString(e) && e.includes("@");
}

export function validateTitle(t) {
  return isNonEmptyString(t) && t.length <= 100;
}

export function validateBio(b) {
  return isNonEmptyString(b) && b.length <= 500;
}

export const VERBOSE_TOTAL = 17;
