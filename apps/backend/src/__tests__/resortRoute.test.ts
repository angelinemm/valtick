import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { app } from "../index";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("GET /resort", () => {
  let agent: ReturnType<typeof request.agent>;
  let userId: string;
  let resortId: string;
  let username: string;

  beforeEach(async () => {
    username = `resorttest_${Date.now()}_${String(Math.random()).slice(2)}`;
    const passwordHash = await bcrypt.hash("test-password", 1);
    const user = await prisma.user.create({
      data: { username, passwordHash, role: "USER" },
    });
    userId = user.id;

    const resort = await prisma.resort.create({
      data: {
        name: "Test Resort",
        userId,
        moneyCents: 1000,
        lastTickAt: new Date(),
      },
    });
    resortId = resort.id;

    await prisma.lift.create({
      data: {
        resortId,
        liftModelKey: "magic_carpet",
        currentBreakProbability: 0.001,
        status: "working",
      },
    });

    agent = request.agent(app);
    await agent.post("/auth/login").send({ username, password: "test-password" });
  });

  afterEach(async () => {
    if (resortId) await prisma.resort.deleteMany({ where: { id: resortId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/resort");
    expect(res.status).toBe(401);
  });

  it("returns 404 when user has no resort", async () => {
    await prisma.resort.deleteMany({ where: { id: resortId } });
    resortId = "";
    const res = await agent.get("/resort");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Game not found" });
  });

  it("returns 200 with the correct resort shape", async () => {
    const res = await agent.get("/resort");
    expect(res.status).toBe(200);
    expect(res.body.resort.name).toBe("Test Resort");
    expect(res.body.resort.moneyCents).toBe(1000);
  });

  it("response includes all 5 liftModels", async () => {
    const res = await agent.get("/resort");
    expect(res.body.liftModels).toHaveLength(5);
    const keys = res.body.liftModels.map((m: { key: string }) => m.key);
    expect(keys).toContain("magic_carpet");
    expect(keys).toContain("cable_car");
  });

  it("summary reflects the one working magic_carpet", async () => {
    const res = await agent.get("/resort");
    const { summary } = res.body;
    expect(summary.incomePerSecCents).toBe(100);
    expect(summary.capacityPerSec).toBe(5);
    expect(summary.passPriceCents).toBe(20);
    expect(summary.totalLifts).toBe(1);
    expect(summary.brokenLiftsCount).toBe(0);
  });

  it("lifts array contains the created lift with correct fields", async () => {
    const res = await agent.get("/resort");
    expect(res.body.lifts).toHaveLength(1);
    const lift = res.body.lifts[0];
    expect(lift.liftModelKey).toBe("magic_carpet");
    expect(lift.status).toBe("working");
    expect(lift.currentBreakProbability).toBe(0.001);
  });
});
