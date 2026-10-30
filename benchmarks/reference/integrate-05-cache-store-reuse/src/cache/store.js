export const cacheStore = new Map();
export async function getOrSet(key, ttlMs, fetcher) {
  const now = Date.now();
  const entry = cacheStore.get(key);
  if (entry && entry.expiresAt > now) return entry.val;
  const val = await fetcher();
  cacheStore.set(key, { val, expiresAt: now + ttlMs });
  return val;
}
