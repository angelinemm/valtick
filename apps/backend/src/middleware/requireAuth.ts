import type { Request, Response, NextFunction } from "express";
import { findUserById } from "../db/userRepository";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
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
  req.user = { id: user.id, email: user.email, role: user.role };
  next();
}
