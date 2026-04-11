import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import { prisma } from "../db/prisma";
import { findResortByGuestId, updateResort } from "../db/resortRepository";
import { createLift, updateLift, bulkUpdateLifts } from "../db/liftRepository";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("repositories", () => {
  const guestId = `test-repo-${Date.now()}`;
  let resortId: string;

  beforeEach(async () => {
    const resort = await prisma.resort.create({
      data: {
        name: "Test Resort",
        guestId: `${guestId}-${Math.random()}`,
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

  describe("findResortByGuestId", () => {
    it("returns null for an unknown guestId", async () => {
      const result = await findResortByGuestId("does-not-exist");
      expect(result).toBeNull();
    });

    it("returns resort with an empty lifts array when no lifts exist", async () => {
      const resort = await prisma.resort.findUnique({ where: { id: resortId } });
      const result = await findResortByGuestId(resort!.guestId);
      expect(result).not.toBeNull();
      expect(result!.lifts).toEqual([]);
    });

    it("returns resort with populated lifts array", async () => {
      const resort = await prisma.resort.findUnique({ where: { id: resortId } });
      await prisma.lift.create({
        data: {
          resortId,
          liftModelKey: "magic_carpet",
          currentBreakProbability: 0.001,
          status: "working",
        },
      });
      const result = await findResortByGuestId(resort!.guestId);
      expect(result!.lifts).toHaveLength(1);
      expect(result!.lifts[0].liftModelKey).toBe("magic_carpet");
    });
  });

  describe("updateResort", () => {
    it("updates moneyCents and lastTickAt", async () => {
      const newTime = new Date("2026-06-01T00:00:00.000Z");
      const updated = await updateResort(resortId, {
        moneyCents: 9999,
        lastTickAt: newTime,
      });
      expect(updated.moneyCents).toBe(9999);
      expect(updated.lastTickAt.toISOString()).toBe(newTime.toISOString());
    });
  });

  describe("createLift", () => {
    it("creates a lift with correct fields", async () => {
      const lift = await createLift({
        resortId,
        liftModelKey: "chairlift",
        currentBreakProbability: 0.001,
        status: "working",
      });
      expect(lift.id).toBeDefined();
      expect(lift.resortId).toBe(resortId);
      expect(lift.liftModelKey).toBe("chairlift");
      expect(lift.currentBreakProbability).toBe(0.001);
      expect(lift.status).toBe("working");
    });
  });

  describe("updateLift", () => {
    it("updates a lift's status", async () => {
      const lift = await prisma.lift.create({
        data: {
          resortId,
          liftModelKey: "magic_carpet",
          currentBreakProbability: 0.001,
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
            currentBreakProbability: 0.001,
            status: "working",
          },
        }),
        prisma.lift.create({
          data: {
            resortId,
            liftModelKey: "drag_lift",
            currentBreakProbability: 0.001,
            status: "working",
          },
        }),
      ]);

      await bulkUpdateLifts([
        { id: a.id, status: "broken", currentBreakProbability: 0.002 },
        { id: b.id, status: "junked", currentBreakProbability: 1.0 },
      ]);

      const [updatedA, updatedB] = await Promise.all([
        prisma.lift.findUnique({ where: { id: a.id } }),
        prisma.lift.findUnique({ where: { id: b.id } }),
      ]);
      expect(updatedA!.status).toBe("broken");
      expect(updatedA!.currentBreakProbability).toBe(0.002);
      expect(updatedB!.status).toBe("junked");
    });

    it("is a no-op with an empty array", async () => {
      await expect(bulkUpdateLifts([])).resolves.toBeUndefined();
    });
  });
});
