import { describe, it, expect, afterEach, afterAll } from "vitest";
import { prisma } from "../db/prisma";
import { createResort } from "../scripts/seedResort";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("createResort", () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    await prisma.resort.deleteMany({ where: { id: { in: createdIds } } });
    createdIds.length = 0;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function seed(suffix = "") {
    const resort = await createResort(
      "Test Resort",
      `seed-test-${Date.now()}${suffix}`
    );
    createdIds.push(resort.id);
    return resort;
  }

  it("creates a resort with moneyCents=500", async () => {
    const resort = await seed();
    expect(resort.moneyCents).toBe(500);
  });

  it("creates exactly one lift", async () => {
    const resort = await seed("-lifts");
    const lifts = await prisma.lift.findMany({ where: { resortId: resort.id } });
    expect(lifts).toHaveLength(1);
  });

  it("the lift is a working magic_carpet with correct break probability", async () => {
    const resort = await seed("-lift-check");
    const lifts = await prisma.lift.findMany({ where: { resortId: resort.id } });
    const lift = lifts[0];
    expect(lift.liftModelKey).toBe("magic_carpet");
    expect(lift.status).toBe("working");
    expect(lift.currentBreakProbability).toBe(0.002);
  });

  it("throws if guestId already exists", async () => {
    const resort = await seed("-dup");
    await expect(
      createResort("Another Resort", resort.guestId)
    ).rejects.toThrow();
  });
});
