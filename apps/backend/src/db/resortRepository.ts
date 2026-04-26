import type { Prisma, Resort, Lift } from "@prisma/client";
import { prisma } from "./prisma";
import { assignLiftName } from "../utils/liftNameGenerator";

export type { Resort, Lift };
export type ResortWithLifts = Prisma.ResortGetPayload<{
  include: { lifts: true };
}>;

export async function findResortByUserId(userId: string): Promise<ResortWithLifts | null> {
  return prisma.resort.findUnique({
    where: { userId },
    include: { lifts: { orderBy: { createdAt: "asc" } } },
  });
}

export async function findResortById(id: string): Promise<ResortWithLifts | null> {
  return prisma.resort.findUnique({
    where: { id },
    include: { lifts: { orderBy: { createdAt: "asc" } } },
  });
}

export async function updateResort(
  id: string,
  data: { moneyCents: number; totalSkiersEver?: number; lastTickAt: Date }
): Promise<Resort> {
  return prisma.resort.update({
    where: { id },
    data,
  });
}

export async function renameResort(id: string, name: string): Promise<Resort> {
  return prisma.resort.update({
    where: { id },
    data: { name },
  });
}

export async function createResortForUser(userId: string, name: string): Promise<ResortWithLifts> {
  return prisma.resort.create({
    data: {
      name,
      userId,
      moneyCents: 500,
      totalSkiersEver: 0,
      lastTickAt: new Date(),
      lifts: {
        create: {
          liftModelKey: "magic_carpet",
          name: assignLiftName([]),
          status: "working",
          breakCount: 0,
        },
      },
    },
    include: { lifts: true },
  });
}

export async function resetResortTickBaseline(userId: string, at: Date): Promise<void> {
  await prisma.resort.updateMany({ where: { userId }, data: { lastTickAt: at } });
}

export async function findIdleResorts(idleThreshold: Date): Promise<Resort[]> {
  return prisma.resort.findMany({
    where: {
      lastTickAt: { lt: idleThreshold },
      user: { firstLoginAt: { not: null } },
    },
  });
}
