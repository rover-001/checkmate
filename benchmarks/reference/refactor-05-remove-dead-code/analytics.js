export function track(event, data = {}) {
  return { event, data, timestamp: Date.now() };
}

export function flush() {
  return true;
}
