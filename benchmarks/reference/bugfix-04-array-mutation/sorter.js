export function sortUsers(users) {
  return [...users].sort((a, b) => a.name.localeCompare(b.name));
}
