import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../index";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("GET /resort/:guestId", () => {
  let guestId: string;
  let resortId: string;

  async function createTestResort(id: string) {
    const resort = await prisma.resort.create({
      data: {
        name: "Test Resort",
        guestId: id,
        moneyCents: 1000,
        lastTickAt: new Date(),
      },
    });
    await prisma.lift.create({
      data: {
        resortId: resort.id,
        liftModelKey: "magic_carpet",
        currentBreakProbability: 0.001,
        status: "working",
      },
    });
    return resort;
  }

  beforeEach(async () => {
    guestId = `test-route-${Date.now()}-${Math.random()}`;
    const resort = await createTestResort(guestId);
    resortId = resort.id;
  });

  afterEach(async () => {
    await prisma.resort.deleteMany({ where: { id: resortId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 404 for an unknown guestId", async () => {
    const res = await request(app).get("/resort/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Game not found" });
  });

  it("returns 200 with the correct resort shape", async () => {
    const res = await request(app).get(`/resort/${guestId}`);
    expect(res.status).toBe(200);
    expect(res.body.resort.guestId).toBe(guestId);
    expect(res.body.resort.name).toBe("Test Resort");
    expect(res.body.resort.moneyCents).toBe(1000);
  });

  it("response includes all 5 liftModels", async () => {
    const res = await request(app).get(`/resort/${guestId}`);
    expect(res.body.liftModels).toHaveLength(5);
    const keys = res.body.liftModels.map((m: { key: string }) => m.key);
    expect(keys).toContain("magic_carpet");
    expect(keys).toContain("cable_car");
  });

  it("summary reflects the one working magic_carpet", async () => {
    const res = await request(app).get(`/resort/${guestId}`);
    const { summary } = res.body;
    expect(summary.incomePerSecCents).toBe(100);
    expect(summary.capacityPerSec).toBe(5);
    expect(summary.passPriceCents).toBe(20);
    expect(summary.totalLifts).toBe(1);
    expect(summary.brokenLiftsCount).toBe(0);
  });

  it("lifts array contains the created lift with correct fields", async () => {
    const res = await request(app).get(`/resort/${guestId}`);
    expect(res.body.lifts).toHaveLength(1);
    const lift = res.body.lifts[0];
    expect(lift.liftModelKey).toBe("magic_carpet");
    expect(lift.status).toBe("working");
    expect(lift.currentBreakProbability).toBe(0.001);
  });
});
