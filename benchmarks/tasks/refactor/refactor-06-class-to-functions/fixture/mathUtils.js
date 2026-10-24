export class MathUtils {
  static add(a, b) {
    return a + b;
  }
  static multiply(a, b) {
    return a * b;
  }
  static clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }
}
