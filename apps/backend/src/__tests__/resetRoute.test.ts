import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { app } from "../index";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("POST /reset", () => {
  let agent: ReturnType<typeof request.agent>;
  let userId: string;
  let resortId: string;
  let username: string;

  beforeEach(async () => {
    username = `resettest_${Date.now()}_${String(Math.random()).slice(2)}`;
    const passwordHash = await bcrypt.hash("test-password", 1);
    const user = await prisma.user.create({
      data: { username, passwordHash, role: "USER" },
    });
    userId = user.id;

    const resort = await prisma.resort.create({
      data: {
        name: "Reset Test Resort",
        userId,
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

    agent = request.agent(app);
    await agent.post("/auth/login").send({ username, password: "test-password" });
  });

  afterEach(async () => {
    await prisma.resort.deleteMany({ where: { id: resortId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).post("/reset").send({});
    expect(res.status).toBe(401);
  });

  it("resets money to 500 cents", async () => {
    const res = await agent.post("/reset").send({});
    expect(res.status).toBe(200);
    expect(res.body.resort.moneyCents).toBe(500);
  });

  it("wipes existing lifts and replaces with 1 magic carpet", async () => {
    const res = await agent.post("/reset").send({});
    expect(res.body.lifts).toHaveLength(1);
    expect(res.body.lifts[0].liftModelKey).toBe("magic_carpet");
  });

  it("new magic carpet is working with 0.002 break probability", async () => {
    const res = await agent.post("/reset").send({});
    expect(res.body.lifts[0].status).toBe("working");
    expect(res.body.lifts[0].currentBreakProbability).toBe(0.002);
  });

  it("response matches full GetResortResponse shape", async () => {
    const res = await agent.post("/reset").send({});
    expect(res.body).toHaveProperty("resort");
    expect(res.body).toHaveProperty("summary");
    expect(res.body).toHaveProperty("liftModels");
    expect(res.body).toHaveProperty("lifts");
  });
});
