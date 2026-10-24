export function canAccess(user, resource) {
  if (!user) return false;
  if (user.isAdmin) return true;
  return Boolean(user.isActive && (resource?.isPublic || user.id === resource?.ownerId));
}
