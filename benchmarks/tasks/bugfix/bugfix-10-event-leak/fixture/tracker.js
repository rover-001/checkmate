export class Tracker {
  constructor() {
    this.listeners = [];
  }
  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      // Bug: pops the last listener instead of removing fn!
      this.listeners.pop();
    };
  }
  notify(val) {
    for (const fn of this.listeners) fn(val);
  }
}
