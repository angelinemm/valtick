import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const rawUrl = process.env.DATABASE_URL ?? "";
const isProd = process.env.NODE_ENV === "production";
const databaseUrl =
  isProd && !rawUrl.includes("sslmode")
    ? rawUrl.includes("?")
      ? `${rawUrl}&sslmode=require`
      : `${rawUrl}?sslmode=require`
    : rawUrl;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
