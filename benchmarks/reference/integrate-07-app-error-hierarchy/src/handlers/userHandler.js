import { AppError } from "../errors/AppError.js";

export function findUserOrThrow(users, id) {
  const user = users.find((u) => u.id === id);
  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }
  return user;
}
