import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import { prisma } from "../db/prisma";
import { updateResort } from "../db/resortRepository";
import { createLift, updateLift, bulkUpdateLifts } from "../db/liftRepository";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("repositories", () => {
  let resortId: string;

  beforeEach(async () => {
    const resort = await prisma.resort.create({
      data: {
        name: "Test Resort",
        moneyCents: 1000,
        lastTickAt: new Date(),
      },
    });
    resortId = resort.id;
  });

  afterEach(async () => {
    await prisma.resort.deleteMany({
      where: { id: resortId },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("updateResort", () => {
    it("updates moneyCents, totalSkiersEver, and lastTickAt", async () => {
      const newTime = new Date("2026-06-01T00:00:00.000Z");
      const updated = await updateResort(resortId, {
        moneyCents: 9999,
        totalSkiersEver: 321,
        lastTickAt: newTime,
      });
      expect(updated.moneyCents).toBe(9999);
      expect(updated.totalSkiersEver).toBe(321);
      expect(updated.lastTickAt.toISOString()).toBe(newTime.toISOString());
    });
  });

  describe("createLift", () => {
    it("creates a lift with correct fields", async () => {
      const lift = await createLift({
        resortId,
        liftModelKey: "chairlift",
        name: "Test Lift",
        breakCount: 0,
        status: "working",
      });
      expect(lift.id).toBeDefined();
      expect(lift.resortId).toBe(resortId);
      expect(lift.liftModelKey).toBe("chairlift");
      expect(lift.breakCount).toBe(0);
      expect(lift.status).toBe("working");
    });
  });

  describe("updateLift", () => {
    it("updates a lift's status", async () => {
      const lift = await prisma.lift.create({
        data: {
          resortId,
          liftModelKey: "magic_carpet",
          name: "Test Lift",
          breakCount: 0,
          status: "working",
        },
      });
      const updated = await updateLift(lift.id, { status: "broken" });
      expect(updated.status).toBe("broken");
    });
  });

  describe("bulkUpdateLifts", () => {
    it("updates multiple lifts atomically", async () => {
      const [a, b] = await Promise.all([
        prisma.lift.create({
          data: {
            resortId,
            liftModelKey: "magic_carpet",
            name: "Test Lift A",
            breakCount: 0,
            status: "working",
          },
        }),
        prisma.lift.create({
          data: {
            resortId,
            liftModelKey: "drag_lift",
            name: "Test Lift B",
            breakCount: 0,
            status: "working",
          },
        }),
      ]);

      await bulkUpdateLifts([
        { id: a.id, status: "broken", breakCount: 1 },
        { id: b.id, status: "junked", breakCount: 5 },
      ]);

      const [updatedA, updatedB] = await Promise.all([
        prisma.lift.findUnique({ where: { id: a.id } }),
        prisma.lift.findUnique({ where: { id: b.id } }),
      ]);
      expect(updatedA!.status).toBe("broken");
      expect(updatedA!.breakCount).toBe(1);
      expect(updatedB!.status).toBe("junked");
    });

    it("is a no-op with an empty array", async () => {
      await expect(bulkUpdateLifts([])).resolves.toBeUndefined();
    });
  });
});
