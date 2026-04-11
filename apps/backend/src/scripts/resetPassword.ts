import bcrypt from "bcrypt";
import { updateUserPasswordHash } from "../db/userRepository";

const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error("Usage: ts-node src/scripts/resetPassword.ts <email> <newPassword>");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(newPassword, 12);
await updateUserPasswordHash(email, passwordHash);
console.log(`Password updated for ${email}`);
process.exit(0);
