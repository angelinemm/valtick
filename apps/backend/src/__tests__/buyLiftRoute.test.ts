import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../index";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("POST /buy_lift", () => {
  let guestId: string;
  let resortId: string;

  beforeEach(async () => {
    guestId = `test-buy-${Date.now()}-${Math.random()}`;
    const resort = await prisma.resort.create({
      data: {
        name: "Buy Test Resort",
        guestId,
        moneyCents: 10000,
        lastTickAt: new Date(),
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

  it("returns 404 for an unknown guestId", async () => {
    const res = await request(app)
      .post("/buy_lift")
      .send({ guestId: "no-such-resort", liftModelKey: "magic_carpet" });
    expect(res.status).toBe(404);
  });

  it("successful buy: new lift appears in response", async () => {
    const res = await request(app)
      .post("/buy_lift")
      .send({ guestId, liftModelKey: "magic_carpet" });
    expect(res.status).toBe(200);
    expect(res.body.lifts).toHaveLength(1);
    expect(res.body.lifts[0].liftModelKey).toBe("magic_carpet");
  });

  it("successful buy: money reduced by purchase price", async () => {
    const res = await request(app)
      .post("/buy_lift")
      .send({ guestId, liftModelKey: "magic_carpet" });
    // magic_carpet costs 5000 cents, started with 10000
    expect(res.body.resort.moneyCents).toBe(5000);
  });

  it("new lift has status working", async () => {
    const res = await request(app)
      .post("/buy_lift")
      .send({ guestId, liftModelKey: "magic_carpet" });
    expect(res.body.lifts[0].status).toBe("working");
  });

  it("new lift has initial break probability 0.002", async () => {
    const res = await request(app)
      .post("/buy_lift")
      .send({ guestId, liftModelKey: "magic_carpet" });
    expect(res.body.lifts[0].currentBreakProbability).toBe(0.002);
  });

  it("insufficient funds: resort unchanged, still returns 200", async () => {
    // gondola costs 200000, we only have 10000
    const res = await request(app).post("/buy_lift").send({ guestId, liftModelKey: "gondola" });
    expect(res.status).toBe(200);
    expect(res.body.lifts).toHaveLength(0);
    expect(res.body.resort.moneyCents).toBe(10000);
  });

  it("can buy multiple lifts of the same type", async () => {
    await request(app).post("/buy_lift").send({ guestId, liftModelKey: "magic_carpet" });
    const res = await request(app)
      .post("/buy_lift")
      .send({ guestId, liftModelKey: "magic_carpet" });
    expect(res.body.lifts).toHaveLength(2);
    expect(res.body.resort.moneyCents).toBe(0);
  });

  it("response matches full GetResortResponse shape", async () => {
    const res = await request(app)
      .post("/buy_lift")
      .send({ guestId, liftModelKey: "magic_carpet" });
    expect(res.body).toHaveProperty("resort");
    expect(res.body).toHaveProperty("summary");
    expect(res.body).toHaveProperty("liftModels");
    expect(res.body).toHaveProperty("lifts");
    expect(res.body.liftModels).toHaveLength(5);
  });

  it("buying at cap is silently rejected: resort unchanged", async () => {
    // cable_car has maxOwned=1; seed one working, then try to buy a second
    await prisma.lift.create({
      data: {
        resortId,
        liftModelKey: "cable_car",
        status: "working",
        currentBreakProbability: 0.002,
      },
    });
    await prisma.resort.update({ where: { id: resortId }, data: { moneyCents: 99999999 } });
    const res = await request(app).post("/buy_lift").send({ guestId, liftModelKey: "cable_car" });
    expect(res.status).toBe(200);
    const cableCars = res.body.lifts.filter(
      (l: { liftModelKey: string }) => l.liftModelKey === "cable_car"
    );
    expect(cableCars).toHaveLength(1);
  });

  it("junked lifts do not count toward the cap", async () => {
    // cable_car maxOwned=1; seed one junked — should still be able to buy one
    await prisma.lift.create({
      data: { resortId, liftModelKey: "cable_car", status: "junked", currentBreakProbability: 1 },
    });
    await prisma.resort.update({ where: { id: resortId }, data: { moneyCents: 99999999 } });
    const res = await request(app).post("/buy_lift").send({ guestId, liftModelKey: "cable_car" });
    expect(res.status).toBe(200);
    const activeCableCars = res.body.lifts.filter(
      (l: { liftModelKey: string; status: string }) =>
        l.liftModelKey === "cable_car" && l.status !== "junked"
    );
    expect(activeCableCars).toHaveLength(1);
  });
});
