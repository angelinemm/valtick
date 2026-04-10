import { describe, it, expect, afterEach } from "vitest";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("Database connectivity", () => {
  const testGuestId = `test-${Date.now()}`;

  afterEach(async () => {
    await prisma.resort.deleteMany({ where: { guestId: testGuestId } });
  });

  it("can create and read a resort", async () => {
    const resort = await prisma.resort.create({
      data: {
        name: "Test Resort",
        guestId: testGuestId,
        moneyCents: 1000,
        lastTickAt: new Date(),
      },
    });

    expect(resort.id).toBeDefined();
    expect(resort.moneyCents).toBe(1000);

    const found = await prisma.resort.findUnique({
      where: { guestId: testGuestId },
    });
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Test Resort");
  });
});
