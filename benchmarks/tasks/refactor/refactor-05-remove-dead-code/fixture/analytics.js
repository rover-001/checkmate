export function oldTrack(event) {
  return "v1:" + event;
}

export function legacyFormat(data) {
  return JSON.stringify({ legacy: data });
}

export function v1Payload(id) {
  return { id, v: 1 };
}

export function track(event, data = {}) {
  return { event, data, timestamp: Date.now() };
}

export function flush() {
  return true;
}
