export function deepMerge(target, source) {
  const isObject = (item) => item && typeof item === "object" && !Array.isArray(item);
  const result = Object.assign({}, target);
  for (const key of Object.keys(source)) {
    if (isObject(source[key]) && isObject(target[key])) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
