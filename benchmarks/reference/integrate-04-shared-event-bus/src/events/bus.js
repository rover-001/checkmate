class EventBus {
  constructor() { this.handlers = new Map(); }
  on(evt, fn) {
    if (!this.handlers.has(evt)) this.handlers.set(evt, []);
    this.handlers.get(evt).push(fn);
  }
  emit(evt, payload) {
    for (const fn of this.handlers.get(evt) || []) fn(payload);
  }
}
export const bus = new EventBus();
