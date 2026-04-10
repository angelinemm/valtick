import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../index";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("POST /repair_lift", () => {
  let guestId: string;
  let resortId: string;
  let brokenLiftId: string;

  beforeEach(async () => {
    guestId = `test-repair-${Date.now()}-${Math.random()}`;
    const resort = await prisma.resort.create({
      data: {
        name: "Repair Test Resort",
        guestId,
        moneyCents: 5000,
        lastTickAt: new Date(),
        lifts: {
          create: {
            liftModelKey: "magic_carpet",
            status: "broken",
            currentBreakProbability: 0.002,
          },
        },
      },
      include: { lifts: true },
    });
    resortId = resort.id;
    brokenLiftId = resort.lifts[0].id;
  });

  afterEach(async () => {
    await prisma.resort.deleteMany({ where: { id: resortId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 404 for unknown guestId", async () => {
    const res = await request(app)
      .post("/repair_lift")
      .send({ guestId: "no-such-resort", liftId: brokenLiftId });
    expect(res.status).toBe(404);
  });

  it("valid repair: lift status changes to working", async () => {
    const res = await request(app)
      .post("/repair_lift")
      .send({ guestId, liftId: brokenLiftId });
    expect(res.status).toBe(200);
    const lift = res.body.lifts.find((l: { id: string }) => l.id === brokenLiftId);
    expect(lift.status).toBe("working");
  });

  it("valid repair: money reduced by repairCostCents", async () => {
    const res = await request(app)
      .post("/repair_lift")
      .send({ guestId, liftId: brokenLiftId });
    // magic_carpet repairCostCents = 100
    expect(res.body.resort.moneyCents).toBe(4900);
  });

  it("repair does not change currentBreakProbability", async () => {
    const res = await request(app)
      .post("/repair_lift")
      .send({ guestId, liftId: brokenLiftId });
    const lift = res.body.lifts.find((l: { id: string }) => l.id === brokenLiftId);
    expect(lift.currentBreakProbability).toBe(0.002);
  });

  it("insufficient funds: resort unchanged, still 200", async () => {
    await prisma.resort.update({
      where: { id: resortId },
      data: { moneyCents: 50 }, // less than 100 repair cost
    });
    const res = await request(app)
      .post("/repair_lift")
      .send({ guestId, liftId: brokenLiftId });
    expect(res.status).toBe(200);
    const lift = res.body.lifts.find((l: { id: string }) => l.id === brokenLiftId);
    expect(lift.status).toBe("broken");
  });

  it("wrong liftId: resort unchanged, still 200", async () => {
    const res = await request(app)
      .post("/repair_lift")
      .send({ guestId, liftId: "00000000-0000-0000-0000-000000000000" });
    expect(res.status).toBe(200);
    expect(res.body.resort.moneyCents).toBe(5000);
  });

  it("lift belonging to a different resort: resort unchanged", async () => {
    const otherResort = await prisma.resort.create({
      data: {
        name: "Other Resort",
        guestId: `other-${Date.now()}`,
        moneyCents: 1000,
        lastTickAt: new Date(),
        lifts: {
          create: {
            liftModelKey: "magic_carpet",
            status: "broken",
            currentBreakProbability: 0.001,
          },
        },
      },
      include: { lifts: true },
    });

    const res = await request(app)
      .post("/repair_lift")
      .send({ guestId, liftId: otherResort.lifts[0].id });
    expect(res.body.resort.moneyCents).toBe(5000);

    await prisma.resort.delete({ where: { id: otherResort.id } });
  });

  it("working lift repair attempt: resort unchanged", async () => {
    const workingLift = await prisma.lift.create({
      data: {
        resortId,
        liftModelKey: "drag_lift",
        status: "working",
        currentBreakProbability: 0.001,
      },
    });
    const res = await request(app)
      .post("/repair_lift")
      .send({ guestId, liftId: workingLift.id });
    expect(res.body.resort.moneyCents).toBe(5000);
  });

  it("junked lift repair attempt: resort unchanged", async () => {
    const junkedLift = await prisma.lift.create({
      data: {
        resortId,
        liftModelKey: "chairlift",
        status: "junked",
        currentBreakProbability: 1.0,
      },
    });
    const res = await request(app)
      .post("/repair_lift")
      .send({ guestId, liftId: junkedLift.id });
    expect(res.body.resort.moneyCents).toBe(5000);
  });
});
