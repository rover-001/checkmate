export class EventEmitter {
  on(event, fn) {}
  off(event, fn) {}
  once(event, fn) {}
  emit(event, ...args) { return false; }
}
