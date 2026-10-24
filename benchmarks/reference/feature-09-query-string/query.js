export function stringify(obj) {
  return Object.entries(obj)
    .map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v))
    .join("&");
}
export function parse(str) {
  if (!str) return {};
  const cleaned = str.startsWith("?") ? str.slice(1) : str;
  if (!cleaned) return {};
  const res = {};
  for (const part of cleaned.split("&")) {
    const [k, v] = part.split("=");
    if (k) res[decodeURIComponent(k)] = v !== undefined ? decodeURIComponent(v) : "";
  }
  return res;
}
