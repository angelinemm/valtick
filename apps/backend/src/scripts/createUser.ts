import bcrypt from "bcrypt";
import { createUser } from "../db/userRepository";
import { prisma } from "../db/prisma";
import type { UserRole } from "@prisma/client";

async function main() {
  const [, , username, password, role = "USER"] = process.argv;

  if (!username || !password) {
    console.error("Usage: ts-node src/scripts/createUser.ts <username> <password> [USER|ADMIN]");
    process.exit(1);
  }

  if (role !== "USER" && role !== "ADMIN") {
    console.error("Role must be USER or ADMIN");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ username, passwordHash, role: role as UserRole });
  console.log(`Created user: ${user.id} (${user.username}, ${user.role})`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
