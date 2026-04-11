import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { app } from "../index";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("POST /repair_lift", () => {
  let agent: ReturnType<typeof request.agent>;
  let userId: string;
  let resortId: string;
  let brokenLiftId: string;
  let username: string;

  beforeEach(async () => {
    username = `repairtest_${Date.now()}_${String(Math.random()).slice(2)}`;
    const passwordHash = await bcrypt.hash("test-password", 1);
    const user = await prisma.user.create({
      data: { username, passwordHash, role: "USER" },
    });
    userId = user.id;

    const resort = await prisma.resort.create({
      data: {
        name: "Repair Test Resort",
        userId,
        moneyCents: 5000,
        lastTickAt: new Date(),
        lifts: {
          create: {
            liftModelKey: "magic_carpet",
            name: "Test Lift",
            status: "broken",
            currentBreakProbability: 0.002,
          },
        },
      },
      include: { lifts: true },
    });
    resortId = resort.id;
    brokenLiftId = resort.lifts[0].id;

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
    const res = await request(app).post("/repair_lift").send({ liftId: brokenLiftId });
    expect(res.status).toBe(401);
  });

  it("valid repair: lift status changes to working", async () => {
    const res = await agent.post("/repair_lift").send({ liftId: brokenLiftId });
    expect(res.status).toBe(200);
    const lift = res.body.lifts.find((l: { id: string }) => l.id === brokenLiftId);
    expect(lift.status).toBe("working");
  });

  it("valid repair: money reduced by repairCostCents", async () => {
    const res = await agent.post("/repair_lift").send({ liftId: brokenLiftId });
    // magic_carpet repairCostCents = 500
    expect(res.body.resort.moneyCents).toBe(4500);
  });

  it("repair does not change currentBreakProbability", async () => {
    const res = await agent.post("/repair_lift").send({ liftId: brokenLiftId });
    const lift = res.body.lifts.find((l: { id: string }) => l.id === brokenLiftId);
    expect(lift.currentBreakProbability).toBe(0.002);
  });

  it("insufficient funds: resort unchanged, still 200", async () => {
    await prisma.resort.update({
      where: { id: resortId },
      data: { moneyCents: 499 }, // less than 500 repair cost
    });
    const res = await agent.post("/repair_lift").send({ liftId: brokenLiftId });
    expect(res.status).toBe(200);
    const lift = res.body.lifts.find((l: { id: string }) => l.id === brokenLiftId);
    expect(lift.status).toBe("broken");
  });

  it("wrong liftId: resort unchanged, still 200", async () => {
    const res = await agent
      .post("/repair_lift")
      .send({ liftId: "00000000-0000-0000-0000-000000000000" });
    expect(res.status).toBe(200);
    expect(res.body.resort.moneyCents).toBe(5000);
  });

  it("lift belonging to a different resort: resort unchanged", async () => {
    const otherResort = await prisma.resort.create({
      data: {
        name: "Other Resort",
        moneyCents: 1000,
        lastTickAt: new Date(),
        lifts: {
          create: {
            liftModelKey: "magic_carpet",
            name: "Other Lift",
            status: "broken",
            currentBreakProbability: 0.001,
          },
        },
      },
      include: { lifts: true },
    });

    const res = await agent.post("/repair_lift").send({ liftId: otherResort.lifts[0].id });
    expect(res.body.resort.moneyCents).toBe(5000);

    await prisma.resort.delete({ where: { id: otherResort.id } });
  });

  it("working lift repair attempt: resort unchanged", async () => {
    const workingLift = await prisma.lift.create({
      data: {
        resortId,
        liftModelKey: "drag_lift",
        name: "Working Lift",
        status: "working",
        currentBreakProbability: 0.001,
      },
    });
    const res = await agent.post("/repair_lift").send({ liftId: workingLift.id });
    expect(res.body.resort.moneyCents).toBe(5000);
  });

  it("junked lift repair attempt: resort unchanged", async () => {
    const junkedLift = await prisma.lift.create({
      data: {
        resortId,
        liftModelKey: "chairlift",
        name: "Junked Lift",
        status: "junked",
        currentBreakProbability: 1.0,
      },
    });
    const res = await agent.post("/repair_lift").send({ liftId: junkedLift.id });
    expect(res.body.resort.moneyCents).toBe(5000);
  });
});
