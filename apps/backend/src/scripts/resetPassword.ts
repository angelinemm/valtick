import { findUserByUsername, updateUserPasswordHashById } from "../db/userRepository";
import { prisma } from "../db/prisma";
import { hashPassword } from "../utils/passwordHash";

async function main() {
  const [, , username, newPassword] = process.argv;

  if (!username || !newPassword) {
    console.error("Usage: ts-node src/scripts/resetPassword.ts <username> <newPassword>");
    process.exit(1);
  }

  const user = await findUserByUsername(username);
  if (!user) {
    console.error(`No user found with username: ${username}`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(newPassword);
  await updateUserPasswordHashById(user.id, passwordHash);
  console.log(`Password updated successfully for ${username}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e.message);
  void prisma.$disconnect();
  process.exit(1);
});
