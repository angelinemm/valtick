import bcrypt from "bcrypt";
import { prisma } from "../db/prisma";
import { findUserByEmail, createUser } from "../db/userRepository";
import type { UserRole } from "@prisma/client";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("Usage: ts-node src/scripts/migrateGuestData.ts <email> <password>");
  process.exit(1);
}

let user = await findUserByEmail(email);
if (!user) {
  const passwordHash = await bcrypt.hash(password, 12);
  user = await createUser({ email, passwordHash, role: "ADMIN" as UserRole });
  console.log(`Created admin user: ${user.id} (${user.email})`);
} else {
  console.log(`Found existing user: ${user.id} (${user.email})`);
}

const result = await prisma.resort.updateMany({
  where: { userId: null },
  data: { userId: user.id },
});

console.log(`Migrated ${result.count} resort(s) to userId ${user.id}`);
process.exit(0);
