import { isPastDate, daysBetween } from "../time/dateUtils.js";

export function checkPlanStatus(expiresAt, now = new Date()) {
  if (isPastDate(expiresAt, now)) {
    return "expired";
  }
  return `active: ${daysBetween(now, expiresAt)} days`;
}
