export function daysBetween(d1, d2) {
  const ms = Math.abs(new Date(d2).getTime() - new Date(d1).getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
export function isPastDate(d, now = new Date()) {
  return new Date(d).getTime() < new Date(now).getTime();
}
