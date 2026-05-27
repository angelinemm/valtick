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
  let extraUserIds: string[];
  let extraResortIds: string[];

  beforeEach(async () => {
    extraUserIds = [];
    extraResortIds = [];
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
        totalSkiersEver: 12345,
        lastTickAt: new Date(),
      },
    });
    resortId = resort.id;

    await prisma.lift.create({
      data: {
        resortId,
        liftModelKey: "magic_carpet",
        name: "Test Lift",
        breakCount: 0,
        status: "working",
      },
    });

    agent = request.agent(app);
    await agent.post("/api/auth/login").send({ username, password: "test-password" });
  });

  afterEach(async () => {
    if (extraResortIds.length)
      await prisma.resort.deleteMany({ where: { id: { in: extraResortIds } } });
    if (resortId) await prisma.resort.deleteMany({ where: { id: resortId } });
    if (extraUserIds.length) await prisma.user.deleteMany({ where: { id: { in: extraUserIds } } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/resort");
    expect(res.status).toBe(401);
  });

  it("auto-creates a resort when user has none", async () => {
    await prisma.resort.deleteMany({ where: { id: resortId } });
    resortId = "";
    const res = await agent.get("/api/resort");
    expect(res.status).toBe(200);
    expect(res.body.resort.name).toBe(username);
    resortId = res.body.resort.id;
  });

  it("returns 200 with the correct resort shape", async () => {
    const res = await agent.get("/api/resort");
    expect(res.status).toBe(200);
    expect(res.body.resort.name).toBe("Test Resort");
    expect(res.body.resort.moneyCents).toBe(1000);
  });

  it("response includes all 5 liftModels", async () => {
    const res = await agent.get("/api/resort");
    expect(res.body.liftModels).toHaveLength(5);
    const keys = res.body.liftModels.map((m: { key: string }) => m.key);
    expect(keys).toContain("magic_carpet");
    expect(keys).toContain("cable_car");
  });

  it("summary reflects the one working magic_carpet", async () => {
    const res = await agent.get("/api/resort");
    const { summary } = res.body;
    expect(summary.incomePerSecCents).toBe(100);
    expect(summary.capacityPerSec).toBe(5);
    expect(summary.passPriceCents).toBe(20);
    expect(summary.totalLifts).toBe(1);
    expect(summary.brokenLiftsCount).toBe(0);
    expect(summary.totalSkiersEver).toBe(12345);
  });

  it("lifts array contains the created lift with correct fields", async () => {
    const res = await agent.get("/api/resort");
    expect(res.body.lifts).toHaveLength(1);
    const lift = res.body.lifts[0];
    expect(lift.liftModelKey).toBe("magic_carpet");
    expect(lift.status).toBe("working");
    expect(lift.breakCount).toBe(0);
  });

  it("returns resort ranking ordered by total skiers and highlights the current user's resort", async () => {
    const passwordHash = await bcrypt.hash("test-password", 1);
    const highUser = await prisma.user.create({
      data: {
        username: `ranking_high_${Date.now()}_${String(Math.random()).slice(2)}`,
        passwordHash,
        role: "USER",
      },
    });
    const lowUser = await prisma.user.create({
      data: {
        username: `ranking_low_${Date.now()}_${String(Math.random()).slice(2)}`,
        passwordHash,
        role: "USER",
      },
    });
    extraUserIds.push(highUser.id, lowUser.id);

    const highResort = await prisma.resort.create({
      data: {
        name: "High Resort",
        userId: highUser.id,
        moneyCents: 1000,
        totalSkiersEver: 99999,
        lastTickAt: new Date(),
      },
    });
    const lowResort = await prisma.resort.create({
      data: {
        name: "Low Resort",
        userId: lowUser.id,
        moneyCents: 1000,
        totalSkiersEver: 10,
        lastTickAt: new Date(),
      },
    });
    extraResortIds.push(highResort.id, lowResort.id);

    const res = await agent.get("/api/ranking");

    expect(res.status).toBe(200);
    const names = res.body.rankings.map((entry: { name: string }) => entry.name);
    expect(names.indexOf("High Resort")).toBeLessThan(names.indexOf("Test Resort"));
    expect(names.indexOf("Test Resort")).toBeLessThan(names.indexOf("Low Resort"));

    const currentUserEntry = res.body.rankings.find(
      (entry: { resortId: string }) => entry.resortId === resortId
    );
    expect(currentUserEntry).toMatchObject({
      name: "Test Resort",
      totalSkiersEver: 12345,
      isCurrentUser: true,
    });
  });
});
