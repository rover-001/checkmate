export class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }
  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
  }
  off(event, fn) {
    if (!this.listeners.has(event)) return;
    const list = this.listeners.get(event).filter((l) => l !== fn && l._original !== fn);
    this.listeners.set(event, list);
  }
  once(event, fn) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      fn(...args);
    };
    wrapper._original = fn;
    this.on(event, wrapper);
  }
  emit(event, ...args) {
    if (!this.listeners.has(event)) return false;
    const list = [...this.listeners.get(event)];
    if (list.length === 0) return false;
    for (const fn of list) fn(...args);
    return true;
  }
}
