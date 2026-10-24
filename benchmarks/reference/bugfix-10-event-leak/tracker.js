export class Tracker {
  constructor() {
    this.listeners = [];
  }
  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      const idx = this.listeners.indexOf(fn);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }
  notify(val) {
    for (const fn of this.listeners) fn(val);
  }
}
