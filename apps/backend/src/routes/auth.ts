import { Router } from "express";
import bcrypt from "bcrypt";
import { findUserByUsername, findUserById, setFirstLoginAt } from "../db/userRepository";
import type { UserDTO } from "@val-tick/shared";

export const authRouter = Router();

function toUserDTO(user: {
  id: string;
  username: string;
  email: string | null;
  role: string;
}): UserDTO {
  return {
    id: user.id,
    username: user.username,
    ...(user.email ? { email: user.email } : {}),
    role: user.role as UserDTO["role"],
  };
}

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };

  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  const user = await findUserByUsername(username);
  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  if (!user.firstLoginAt) {
    await setFirstLoginAt(user.id, new Date());
  }

  req.session.userId = user.id;
  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session error" });
      return;
    }
    res.json({ user: toUserDTO(user) });
  });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

authRouter.get("/me", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const user = await findUserById(userId);
  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({ user: toUserDTO(user) });
});
