import { describe, it, expect, afterEach } from "vitest";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("Database connectivity", () => {
  let createdId: string | undefined;

  afterEach(async () => {
    if (createdId) {
      await prisma.resort.deleteMany({ where: { id: createdId } });
      createdId = undefined;
    }
  });

  it("can create and read a resort", async () => {
    const resort = await prisma.resort.create({
      data: {
        name: "Test Resort",
        moneyCents: 1000,
        lastTickAt: new Date(),
      },
    });
    createdId = resort.id;

    expect(resort.id).toBeDefined();
    expect(resort.moneyCents).toBe(1000);

    const found = await prisma.resort.findUnique({ where: { id: resort.id } });
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Test Resort");
  });
});
