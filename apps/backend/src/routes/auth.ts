import { Router } from "express";
import bcrypt from "bcrypt";
import { findUserByEmail, findUserById } from "../db/userRepository";
import type { UserDTO } from "@val-tick/shared";

export const authRouter = Router();

function toUserDTO(user: { id: string; email: string; role: string }): UserDTO {
  return { id: user.id, email: user.email, role: user.role as UserDTO["role"] };
}

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
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
