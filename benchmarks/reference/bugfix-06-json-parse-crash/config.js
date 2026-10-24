export function loadConfig(jsonStr, defaultConfig) {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return defaultConfig;
  }
}
