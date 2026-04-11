import bcrypt from "bcrypt";
import { updateUserPasswordHash } from "../db/userRepository";
import { prisma } from "../db/prisma";

async function main() {
  const [, , username, newPassword] = process.argv;

  if (!username || !newPassword) {
    console.error("Usage: ts-node src/scripts/resetPassword.ts <username> <newPassword>");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await updateUserPasswordHash(username, passwordHash);
  console.log(`Password updated for ${username}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
