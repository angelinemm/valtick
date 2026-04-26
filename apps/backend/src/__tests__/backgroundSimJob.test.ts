import { describe, it, expect, afterEach, afterAll } from "vitest";
import bcrypt from "bcrypt";
import { prisma } from "../db/prisma";
import { runBackgroundSim } from "../jobs/backgroundSimJob";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("runBackgroundSim", () => {
  const resortIds: string[] = [];
  const userIds: string[] = [];

  async function createUser(opts: { firstLoginAt?: Date | null } = {}) {
    const username = `simtest_${Date.now()}_${String(Math.random()).slice(2)}`;
    const passwordHash = await bcrypt.hash("pw", 1);
    const firstLoginAt = "firstLoginAt" in opts ? opts.firstLoginAt : new Date();
    const user = await prisma.user.create({
      data: { username, passwordHash, role: "USER", firstLoginAt },
    });
    userIds.push(user.id);
    return user;
  }

  async function createResort(opts: {
    idleHours: number;
    liftStatus?: "working" | "broken" | "junked";
    userId: string;
  }) {
    const hoursAgo = new Date(Date.now() - opts.idleHours * 60 * 60 * 1000);
    const resort = await prisma.resort.create({
      data: {
        name: "Sim Test Resort",
        userId: opts.userId,
        moneyCents: 0,
        lastTickAt: hoursAgo,
        lifts: opts.liftStatus
          ? {
              create: {
                liftModelKey: "magic_carpet",
                name: "Test Lift",
                status: opts.liftStatus,
                breakCount: 0,
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
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    resortIds.length = 0;
    userIds.length = 0;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("does not touch resorts updated within the last 2 hours", async () => {
    const user = await createUser();
    const resort = await createResort({ idleHours: 1, liftStatus: "working", userId: user.id });

    await runBackgroundSim();

    const after = await prisma.resort.findUnique({ where: { id: resort.id } });
    expect(after!.moneyCents).toBe(0);
    expect(after!.lastTickAt.toISOString()).toBe(resort.lastTickAt.toISOString());
  });

  it("simulates idle resort with working lift — money increases", async () => {
    const user = await createUser();
    await createResort({ idleHours: 3, liftStatus: "working", userId: user.id });

    await runBackgroundSim();

    const updated = await prisma.resort.findFirst({
      where: { id: { in: resortIds } },
    });
    expect(updated!.moneyCents).toBeGreaterThan(0);
  });

  it("resort with all broken lifts: money unchanged, lastTickAt updated", async () => {
    const user = await createUser();
    const resort = await createResort({ idleHours: 3, liftStatus: "broken", userId: user.id });

    await runBackgroundSim();

    const after = await prisma.resort.findUnique({ where: { id: resort.id } });
    expect(after!.moneyCents).toBe(0);
    expect(after!.lastTickAt.getTime()).toBeGreaterThan(resort.lastTickAt.getTime());
  });

  it("resort with all junked lifts: money unchanged, lastTickAt updated", async () => {
    const user = await createUser();
    const resort = await createResort({ idleHours: 3, liftStatus: "junked", userId: user.id });

    await runBackgroundSim();

    const after = await prisma.resort.findUnique({ where: { id: resort.id } });
    expect(after!.moneyCents).toBe(0);
    expect(after!.lastTickAt.getTime()).toBeGreaterThan(resort.lastTickAt.getTime());
  });

  it("skips idle resort when user has never logged in (firstLoginAt is null)", async () => {
    const user = await createUser({ firstLoginAt: null });
    const resort = await createResort({ idleHours: 3, liftStatus: "working", userId: user.id });

    await runBackgroundSim();

    const after = await prisma.resort.findUnique({ where: { id: resort.id } });
    expect(after!.moneyCents).toBe(0);
    expect(after!.lastTickAt.toISOString()).toBe(resort.lastTickAt.toISOString());
  });

  it("error in one resort does not prevent others from being processed", async () => {
    const user1 = await createUser();
    const user2 = await createUser();

    // Create a valid idle resort
    await createResort({ idleHours: 3, liftStatus: "working", userId: user1.id });

    // Create a resort with an invalid liftModelKey to trigger an error during sim
    const badResort = await prisma.resort.create({
      data: {
        name: "Bad Resort",
        userId: user2.id,
        moneyCents: 0,
        lastTickAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        lifts: {
          create: {
            liftModelKey: "not_a_real_model",
            name: "Bad Lift",
            status: "working",
            breakCount: 0,
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
