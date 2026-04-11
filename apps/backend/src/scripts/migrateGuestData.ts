import bcrypt from "bcrypt";
import { prisma } from "../db/prisma";
import { findUserByUsername, createUser } from "../db/userRepository";
import type { UserRole } from "@prisma/client";

async function main() {
  const [, , username, password] = process.argv;

  if (!username || !password) {
    console.error("Usage: ts-node src/scripts/migrateGuestData.ts <username> <password>");
    process.exit(1);
  }

  let user = await findUserByUsername(username);
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 12);
    user = await createUser({ username, passwordHash, role: "ADMIN" as UserRole });
    console.log(`Created admin user: ${user.id} (${user.username})`);
  } else {
    console.log(`Found existing user: ${user.id} (${user.username})`);
  }

  const result = await prisma.resort.updateMany({
    where: { userId: null },
    data: { userId: user.id },
  });

  console.log(`Migrated ${result.count} resort(s) to userId ${user.id}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
