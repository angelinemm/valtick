import type { UserRole } from "@prisma/client";
import { prisma } from "./prisma";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: { email: string; passwordHash: string; role: UserRole }) {
  return prisma.user.create({ data });
}

export async function updateUserPasswordHash(email: string, passwordHash: string) {
  return prisma.user.update({ where: { email }, data: { passwordHash } });
}
