const OPS = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => a * b,
  div: (a, b) => b === 0 ? null : a / b
};

export function calculate(op, a, b) {
  const fn = OPS[op];
  if (!fn) throw new Error("Unknown op: " + op);
  return fn(a, b);
}
