import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const rawUrl = process.env.DATABASE_URL ?? "";
const isProd = process.env.NODE_ENV === "production";
const databaseUrl = isProd ? new URL(rawUrl) : undefined;

if (databaseUrl) {
  databaseUrl.searchParams.set("sslmode", "no-verify");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl?.toString() ?? rawUrl,
  ssl: isProd ? { rejectUnauthorized: false } : undefined,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
