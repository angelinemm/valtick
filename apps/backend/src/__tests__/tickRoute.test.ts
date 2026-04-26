import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { app } from "../index";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("POST /tick", () => {
  let agent: ReturnType<typeof request.agent>;
  let userId: string;
  let resortId: string;
  let username: string;

  beforeEach(async () => {
    username = `ticktest_${Date.now()}_${String(Math.random()).slice(2)}`;
    const passwordHash = await bcrypt.hash("test-password", 1);
    const user = await prisma.user.create({
      data: { username, passwordHash, role: "USER" },
    });
    userId = user.id;

    const resort = await prisma.resort.create({
      data: {
        name: "Tick Test Resort",
        userId,
        moneyCents: 1000,
        totalSkiersEver: 0,
        lastTickAt: new Date(),
        lifts: {
          create: {
            liftModelKey: "magic_carpet",
            name: "Test Lift",
            status: "working",
            breakCount: 0,
          },
        },
      },
    });
    resortId = resort.id;

    agent = request.agent(app);
    await agent.post("/api/auth/login").send({ username, password: "test-password" });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await prisma.resort.deleteMany({ where: { id: resortId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).post("/api/tick").send({});
    expect(res.status).toBe(401);
  });

  it("returns { ok: true } for an authenticated user", async () => {
    const res = await agent.post("/api/tick").send({});
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("adds income to money after a tick", async () => {
    vi.spyOn(Math, "random").mockReturnValue(1); // no breaks
    await agent.post("/api/tick").send({});

    const res = await agent.get("/api/resort");
    // magic_carpet: 5 * 20 = 100 cents added to starting 1000
    expect(res.body.resort.moneyCents).toBe(1100);
  });

  it("adds working capacity to totalSkiersEver after a tick", async () => {
    vi.spyOn(Math, "random").mockReturnValue(1); // no breaks
    await agent.post("/api/tick").send({});

    const res = await agent.get("/api/resort");
    expect(res.body.summary.totalSkiersEver).toBe(5);
  });

  it("updates lastTickAt after a tick", async () => {
    const before = Date.now();
    await agent.post("/api/tick").send({});

    const res = await agent.get("/api/resort");
    const lastTickAt = new Date(res.body.resort.lastTickAt).getTime();
    expect(lastTickAt).toBeGreaterThanOrEqual(before);
  });

  it("returns { ok: true } but does not process tick when firstLoginAt is null", async () => {
    // Clear firstLoginAt to simulate a user who has never fully logged in
    await prisma.user.update({ where: { id: userId }, data: { firstLoginAt: null } });

    const moneyCentsBefore = 1000;
    const res = await agent.post("/api/tick").send({});
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const resort = await prisma.resort.findUnique({ where: { id: resortId } });
    expect(resort!.moneyCents).toBe(moneyCentsBefore);
  });

  it("lift at max repairable breaks becomes junked when break is forced", async () => {
    await prisma.lift.updateMany({
      where: { resortId },
      data: { breakCount: 5 },
    });

    vi.spyOn(Math, "random").mockReturnValue(0); // force break

    await agent.post("/api/tick").send({});

    const res = await agent.get("/api/resort");
    expect(res.body.lifts[0].status).toBe("junked");
  });
});
