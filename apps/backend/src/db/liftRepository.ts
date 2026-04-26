import type { Lift } from "@prisma/client";
import { prisma } from "./prisma";

export async function createLift(data: {
  resortId: string;
  liftModelKey: string;
  name: string;
  breakCount: number;
  status: "working" | "broken" | "junked";
}): Promise<Lift> {
  return prisma.lift.create({ data });
}

export async function updateLift(
  id: string,
  data: Partial<{
    status: "working" | "broken" | "junked";
    breakCount: number;
  }>
): Promise<Lift> {
  return prisma.lift.update({ where: { id }, data });
}

export async function deleteAllLiftsForResort(resortId: string): Promise<void> {
  await prisma.lift.deleteMany({ where: { resortId } });
}

export async function bulkUpdateLifts(
  updates: Array<{
    id: string;
    status: "working" | "broken" | "junked";
    breakCount: number;
  }>
): Promise<void> {
  if (updates.length === 0) return;

  await prisma.$transaction(
    updates.map(({ id, status, breakCount }) =>
      prisma.lift.update({
        where: { id },
        data: { status, breakCount },
      })
    )
  );
}
