import { describe, it, expect, afterEach, afterAll } from "vitest";
import { prisma } from "../db/prisma";
import { runBackgroundSim } from "../jobs/backgroundSimJob";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("runBackgroundSim", () => {
  const resortIds: string[] = [];

  async function createResort(opts: {
    idleHours: number;
    liftStatus?: "working" | "broken" | "junked";
  }) {
    const hoursAgo = new Date(Date.now() - opts.idleHours * 60 * 60 * 1000);
    const resort = await prisma.resort.create({
      data: {
        name: "Sim Test Resort",
        moneyCents: 0,
        lastTickAt: hoursAgo,
        lifts: opts.liftStatus
          ? {
              create: {
                liftModelKey: "magic_carpet",
                status: opts.liftStatus,
                currentBreakProbability: 0.001,
              },
            }
          : undefined,
      },
    });
    resortIds.push(resort.id);
    return resort;
  }

  afterEach(async () => {
    await prisma.resort.deleteMany({ where: { id: { in: resortIds } } });
    resortIds.length = 0;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("does not touch resorts updated within the last 2 hours", async () => {
    const resort = await createResort({ idleHours: 1, liftStatus: "working" });

    await runBackgroundSim();

    const after = await prisma.resort.findUnique({ where: { id: resort.id } });
    expect(after!.moneyCents).toBe(0);
    expect(after!.lastTickAt.toISOString()).toBe(resort.lastTickAt.toISOString());
  });

  it("simulates idle resort with working lift — money increases", async () => {
    // 3 hours idle, working magic_carpet → should earn income
    await createResort({ idleHours: 3, liftStatus: "working" });

    await runBackgroundSim();

    const updated = await prisma.resort.findFirst({
      where: { id: { in: resortIds } },
    });
    expect(updated!.moneyCents).toBeGreaterThan(0);
  });

  it("resort with all broken lifts: money unchanged, lastTickAt updated", async () => {
    const resort = await createResort({ idleHours: 3, liftStatus: "broken" });

    await runBackgroundSim();

    const after = await prisma.resort.findUnique({ where: { id: resort.id } });
    expect(after!.moneyCents).toBe(0);
    expect(after!.lastTickAt.getTime()).toBeGreaterThan(resort.lastTickAt.getTime());
  });

  it("resort with all junked lifts: money unchanged, lastTickAt updated", async () => {
    const resort = await createResort({ idleHours: 3, liftStatus: "junked" });

    await runBackgroundSim();

    const after = await prisma.resort.findUnique({ where: { id: resort.id } });
    expect(after!.moneyCents).toBe(0);
    expect(after!.lastTickAt.getTime()).toBeGreaterThan(resort.lastTickAt.getTime());
  });

  it("error in one resort does not prevent others from being processed", async () => {
    // Create a valid idle resort
    await createResort({ idleHours: 3, liftStatus: "working" });

    // Create a resort with an invalid liftModelKey to trigger an error during sim
    const badResort = await prisma.resort.create({
      data: {
        name: "Bad Resort",
        moneyCents: 0,
        lastTickAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        lifts: {
          create: {
            liftModelKey: "not_a_real_model",
            status: "working",
            currentBreakProbability: 0.001,
          },
        },
      },
    });
    resortIds.push(badResort.id);

    // Should not throw even though one resort fails
    await expect(runBackgroundSim()).resolves.toBeUndefined();

    // The valid resort should still have been processed
    const validResort = await prisma.resort.findFirst({
      where: { id: { in: resortIds.filter((id) => id !== badResort.id) } },
    });
    expect(validResort!.moneyCents).toBeGreaterThan(0);
  });
});
