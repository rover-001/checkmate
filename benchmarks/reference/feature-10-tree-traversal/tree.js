export function findNode(root, predicate) {
  if (!root) return null;
  if (predicate(root)) return root;
  for (const child of root.children || []) {
    const res = findNode(child, predicate);
    if (res) return res;
  }
  return null;
}
export function collectValues(root) {
  if (!root) return [];
  const res = [root.val];
  for (const child of root.children || []) {
    res.push(...collectValues(child));
  }
  return res;
}
