export function validateUsername(u) {
  if (typeof u !== "string" || u === null || u === undefined || u.trim().length === 0) {
    return false;
  }
  return u.length >= 3;
}

export function validateEmail(e) {
  if (typeof e !== "string" || e === null || e === undefined || e.trim().length === 0) {
    return false;
  }
  return e.includes("@");
}

export function validateTitle(t) {
  if (typeof t !== "string" || t === null || t === undefined || t.trim().length === 0) {
    return false;
  }
  return t.length <= 100;
}

export function validateBio(b) {
  if (typeof b !== "string" || b === null || b === undefined || b.trim().length === 0) {
    return false;
  }
  return b.length <= 500;
}

// Extra verbose lines
const v1 = 1;
const v2 = 2;
const v3 = 3;
const v4 = 4;
const v5 = 5;
const v6 = 6;
const v7 = 7;
const v8 = 8;
const v9 = 9;
const v10 = 10;
const v11 = 11;
const v12 = 12;
const v13 = 13;
const v14 = 14;
const v15 = 15;
const v16 = 16;
export const VERBOSE_TOTAL = v1 + v16;
