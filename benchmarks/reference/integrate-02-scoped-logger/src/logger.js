export const logStore = [];
export function createScopedLogger(scope) {
  return {
    info(msg) { logStore.push(`[${scope}] [INFO] ${msg}`); },
    error(msg) { logStore.push(`[${scope}] [ERROR] ${msg}`); }
  };
}
