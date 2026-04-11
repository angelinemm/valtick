import type { Resort, Lift } from "@prisma/client";
import { prisma } from "./prisma";

export type { Resort, Lift };

export async function findResortByUserId(
  userId: string
): Promise<(Resort & { lifts: Lift[] }) | null> {
  return prisma.resort.findUnique({
    where: { userId },
    include: { lifts: true },
  });
}

export async function findResortById(id: string): Promise<(Resort & { lifts: Lift[] }) | null> {
  return prisma.resort.findUnique({
    where: { id },
    include: { lifts: true },
  });
}

export async function updateResort(
  id: string,
  data: { moneyCents: number; lastTickAt: Date }
): Promise<Resort> {
  return prisma.resort.update({
    where: { id },
    data,
  });
}

export async function findIdleResorts(idleThreshold: Date): Promise<Resort[]> {
  return prisma.resort.findMany({
    where: { lastTickAt: { lt: idleThreshold } },
  });
}
