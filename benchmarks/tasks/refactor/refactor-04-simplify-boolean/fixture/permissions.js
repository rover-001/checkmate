export function canAccess(user, resource) {
  if (user === null || user === undefined) {
    return false;
  }
  if (user.isAdmin === true) {
    return true;
  }
  if (user.isActive === true) {
    if (resource.isPublic === true) {
      return true;
    } else {
      if (user.id === resource.ownerId) {
        return true;
      } else {
        return false;
      }
    }
  } else {
    return false;
  }
}
