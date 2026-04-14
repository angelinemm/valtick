import type { UserRole } from "@prisma/client";
import { prisma } from "./prisma";

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: {
  username: string;
  email?: string;
  passwordHash: string;
  role: UserRole;
}) {
  return prisma.user.create({ data });
}

export async function updateUserPasswordHash(username: string, passwordHash: string) {
  return prisma.user.update({ where: { username }, data: { passwordHash } });
}

export async function updateUserPasswordHashById(id: string, passwordHash: string) {
  return prisma.user.update({ where: { id }, data: { passwordHash } });
}

export async function deleteUserById(id: string) {
  return prisma.user.delete({ where: { id } });
}

export async function setFirstLoginAt(id: string, at: Date) {
  return prisma.user.update({ where: { id }, data: { firstLoginAt: at } });
}

export async function findAllUsersWithResorts() {
  return prisma.user.findMany({
    include: {
      resort: {
        include: {
          lifts: {
            where: { status: "working" },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
