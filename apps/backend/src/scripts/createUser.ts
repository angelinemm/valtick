import bcrypt from "bcrypt";
import { createUser } from "../db/userRepository";
import type { UserRole } from "@prisma/client";

const [, , email, password, role = "USER"] = process.argv;

if (!email || !password) {
  console.error("Usage: ts-node src/scripts/createUser.ts <email> <password> [USER|ADMIN]");
  process.exit(1);
}

if (role !== "USER" && role !== "ADMIN") {
  console.error("Role must be USER or ADMIN");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 12);
const user = await createUser({ email, passwordHash, role: role as UserRole });
console.log(`Created user: ${user.id} (${user.email}, ${user.role})`);
process.exit(0);
