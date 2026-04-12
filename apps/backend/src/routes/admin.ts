import { Router } from "express";
import bcrypt from "bcrypt";
import { requireAdmin } from "../middleware/requireAdmin";
import {
  findAllUsersWithResorts,
  findUserById,
  createUser,
  updateUserPasswordHashById,
  deleteUserById,
} from "../db/userRepository";
import { findResortByUserId, createResortForUser } from "../db/resortRepository";
import { resetResort } from "../services/liftService";
import { generatePassword } from "../utils/passwordGenerator";
import { generateResortName } from "../utils/resortNameGenerator";
import type { AdminUserDTO, CreateAdminUserRequest } from "@val-tick/shared";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

function toAdminUserDTO(
  user: Awaited<ReturnType<typeof findAllUsersWithResorts>>[number]
): AdminUserDTO {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role as AdminUserDTO["role"],
    resort: user.resort
      ? {
          id: user.resort.id,
          name: user.resort.name,
          moneyCents: user.resort.moneyCents,
          liftsCount: user.resort._count.lifts,
        }
      : null,
  };
}

adminRouter.get("/users", async (_req, res) => {
  const users = await findAllUsersWithResorts();
  res.json({ users: users.map(toAdminUserDTO) });
});

adminRouter.post("/users", async (req, res) => {
  const { username, email } = req.body as CreateAdminUserRequest;

  if (!username) {
    res.status(400).json({ error: "Username is required" });
    return;
  }

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await createUser({
    username,
    ...(email ? { email } : {}),
    passwordHash,
    role: "USER",
  });

  const resort = await createResortForUser(user.id, generateResortName());

  const adminUserDTO: AdminUserDTO = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role as AdminUserDTO["role"],
    resort: {
      id: resort.id,
      name: resort.name,
      moneyCents: resort.moneyCents,
      liftsCount: resort.lifts.length,
    },
  };

  res.status(201).json({ user: adminUserDTO, password });
});

adminRouter.post("/users/:id/reset-password", async (req, res) => {
  const { id } = req.params;

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  await updateUserPasswordHashById(id, passwordHash);

  res.json({ password });
});

adminRouter.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  if (id === req.user!.id) {
    res.status(403).json({ error: "You cannot delete your own account" });
    return;
  }

  const target = await findUserById(id);
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (target.role === "ADMIN") {
    res.status(403).json({ error: "Admin accounts cannot be deleted through this interface" });
    return;
  }

  await deleteUserById(id);
  res.json({ ok: true });
});

adminRouter.post("/users/:id/reset-resort", async (req, res) => {
  const { id } = req.params;

  const resort = await findResortByUserId(id);

  if (!resort) {
    await createResortForUser(id, generateResortName());
  } else {
    await resetResort(resort);
  }

  res.json({ ok: true });
});
