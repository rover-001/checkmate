export function deepExtend(target, source) {
  for (const key of Object.keys(source)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepExtend(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
