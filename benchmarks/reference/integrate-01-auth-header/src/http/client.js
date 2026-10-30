export function buildAuthHeader(token, type = "Bearer") {
  if (!token) throw new Error("Token required");
  return `${type} ${token}`;
}
export async function request(url, options = {}) {
  return { status: 200, url, headers: options.headers || {} };
}
