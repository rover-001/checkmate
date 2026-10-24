export function calculate(op, a, b) {
  switch (op) {
    case "add":
      return a + b;
    case "sub":
      return a - b;
    case "mul":
      return a * b;
    case "div":
      return b === 0 ? null : a / b;
    default:
      throw new Error("Unknown op: " + op);
  }
}
