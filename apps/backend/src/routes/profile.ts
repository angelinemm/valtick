import { Router } from "express";
import bcrypt from "bcrypt";
import { findUserById, updateUserPasswordHashById } from "../db/userRepository";
import { hashPassword } from "../utils/passwordHash";

export const profileRouter = Router();

const SPECIAL_CHARS = /[\d!@#$%^&*()\-_=+[\]{}|;:,.<>?]/;

function validateNewPassword(password: string): string | null {
  if (password.length < 8) return "New password must be at least 8 characters";
  if (!SPECIAL_CHARS.test(password))
    return "New password must contain at least one number or special character";
  return null;
}

profileRouter.post("/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" });
    return;
  }

  const validationError = validateNewPassword(newPassword);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const user = await findUserById(req.user!.id);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }

  const newHash = await hashPassword(newPassword);
  await updateUserPasswordHashById(user.id, newHash);

  res.json({ ok: true });
});
