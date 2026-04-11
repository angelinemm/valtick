import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../index";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("POST /reset", () => {
  let guestId: string;
  let resortId: string;

  beforeEach(async () => {
    guestId = `test-reset-${Date.now()}-${Math.random()}`;
    const resort = await prisma.resort.create({
      data: {
        name: "Reset Test Resort",
        guestId,
        moneyCents: 99999,
        lastTickAt: new Date(),
        lifts: {
          create: [
            { liftModelKey: "gondola", status: "working", currentBreakProbability: 0.5 },
            { liftModelKey: "chairlift", status: "broken", currentBreakProbability: 1.0 },
          ],
        },
      },
    });
    resortId = resort.id;
  });

  afterEach(async () => {
    await prisma.resort.deleteMany({ where: { id: resortId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 404 for unknown guestId", async () => {
    const res = await request(app).post("/reset").send({ guestId: "no-such-resort" });
    expect(res.status).toBe(404);
  });

  it("resets money to 1000 cents", async () => {
    const res = await request(app).post("/reset").send({ guestId });
    expect(res.status).toBe(200);
    expect(res.body.resort.moneyCents).toBe(1000);
  });

  it("wipes existing lifts and replaces with 1 magic carpet", async () => {
    const res = await request(app).post("/reset").send({ guestId });
    expect(res.body.lifts).toHaveLength(1);
    expect(res.body.lifts[0].liftModelKey).toBe("magic_carpet");
  });

  it("new magic carpet is working with 0.001 break probability", async () => {
    const res = await request(app).post("/reset").send({ guestId });
    expect(res.body.lifts[0].status).toBe("working");
    expect(res.body.lifts[0].currentBreakProbability).toBe(0.001);
  });

  it("response matches full GetResortResponse shape", async () => {
    const res = await request(app).post("/reset").send({ guestId });
    expect(res.body).toHaveProperty("resort");
    expect(res.body).toHaveProperty("summary");
    expect(res.body).toHaveProperty("liftModels");
    expect(res.body).toHaveProperty("lifts");
  });
});
