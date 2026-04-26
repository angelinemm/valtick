import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { app } from "../index";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("POST /buy_lift", () => {
  let agent: ReturnType<typeof request.agent>;
  let userId: string;
  let resortId: string;
  let username: string;

  beforeEach(async () => {
    username = `buytest_${Date.now()}_${String(Math.random()).slice(2)}`;
    const passwordHash = await bcrypt.hash("test-password", 1);
    const user = await prisma.user.create({
      data: { username, passwordHash, role: "USER" },
    });
    userId = user.id;

    const resort = await prisma.resort.create({
      data: {
        name: "Buy Test Resort",
        userId,
        moneyCents: 10000,
        lastTickAt: new Date(),
      },
    });
    resortId = resort.id;

    agent = request.agent(app);
    await agent.post("/api/auth/login").send({ username, password: "test-password" });
  });

  afterEach(async () => {
    await prisma.resort.deleteMany({ where: { id: resortId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).post("/api/buy_lift").send({ liftModelKey: "magic_carpet" });
    expect(res.status).toBe(401);
  });

  it("successful buy: new lift appears in response", async () => {
    const res = await agent.post("/api/buy_lift").send({ liftModelKey: "magic_carpet" });
    expect(res.status).toBe(200);
    expect(res.body.lifts).toHaveLength(1);
    expect(res.body.lifts[0].liftModelKey).toBe("magic_carpet");
  });

  it("successful buy: money reduced by purchase price", async () => {
    const res = await agent.post("/api/buy_lift").send({ liftModelKey: "magic_carpet" });
    // magic_carpet costs 5000 cents, started with 10000
    expect(res.body.resort.moneyCents).toBe(5000);
  });

  it("new lift has status working", async () => {
    const res = await agent.post("/api/buy_lift").send({ liftModelKey: "magic_carpet" });
    expect(res.body.lifts[0].status).toBe("working");
  });

  it("new lift starts with breakCount 0", async () => {
    const res = await agent.post("/api/buy_lift").send({ liftModelKey: "magic_carpet" });
    expect(res.body.lifts[0].breakCount).toBe(0);
  });

  it("new lift has a non-empty name assigned", async () => {
    const res = await agent.post("/api/buy_lift").send({ liftModelKey: "magic_carpet" });
    expect(typeof res.body.lifts[0].name).toBe("string");
    expect(res.body.lifts[0].name.length).toBeGreaterThan(0);
  });

  it("two lifts bought in the same resort get different names", async () => {
    await agent.post("/api/buy_lift").send({ liftModelKey: "magic_carpet" });
    const res = await agent.post("/api/buy_lift").send({ liftModelKey: "magic_carpet" });
    const names = res.body.lifts.map((l: { name: string }) => l.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("insufficient funds: resort unchanged, still returns 200", async () => {
    // gondola costs 200000, we only have 10000
    const res = await agent.post("/api/buy_lift").send({ liftModelKey: "gondola" });
    expect(res.status).toBe(200);
    expect(res.body.lifts).toHaveLength(0);
    expect(res.body.resort.moneyCents).toBe(10000);
  });

  it("can buy multiple lifts of the same type", async () => {
    await agent.post("/api/buy_lift").send({ liftModelKey: "magic_carpet" });
    const res = await agent.post("/api/buy_lift").send({ liftModelKey: "magic_carpet" });
    expect(res.body.lifts).toHaveLength(2);
    expect(res.body.resort.moneyCents).toBe(0);
  });

  it("response matches full GetResortResponse shape", async () => {
    const res = await agent.post("/api/buy_lift").send({ liftModelKey: "magic_carpet" });
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
        name: "Test Cable Car",
        status: "working",
        breakCount: 0,
      },
    });
    await prisma.resort.update({ where: { id: resortId }, data: { moneyCents: 99999999 } });
    const res = await agent.post("/api/buy_lift").send({ liftModelKey: "cable_car" });
    expect(res.status).toBe(200);
    expect(res.body.resort.moneyCents).toBe(99999999);
    const cableCars = res.body.lifts.filter(
      (l: { liftModelKey: string }) => l.liftModelKey === "cable_car"
    );
    expect(cableCars).toHaveLength(1);
  });

  it("buying below limit succeeds", async () => {
    await prisma.resort.update({ where: { id: resortId }, data: { moneyCents: 99999999 } });
    await prisma.lift.createMany({
      data: [
        {
          resortId,
          liftModelKey: "magic_carpet",
          name: "Magic One",
          status: "working",
          breakCount: 0,
        },
        {
          resortId,
          liftModelKey: "magic_carpet",
          name: "Magic Two",
          status: "broken",
          breakCount: 1,
        },
        {
          resortId,
          liftModelKey: "magic_carpet",
          name: "Magic Three",
          status: "working",
          breakCount: 0,
        },
      ],
    });

    const res = await agent.post("/api/buy_lift").send({ liftModelKey: "magic_carpet" });
    expect(res.status).toBe(200);

    const ownedMagicCarpets = res.body.lifts.filter(
      (l: { liftModelKey: string; status: string }) =>
        l.liftModelKey === "magic_carpet" && (l.status === "working" || l.status === "broken")
    );
    expect(ownedMagicCarpets).toHaveLength(4);
    expect(res.body.resort.moneyCents).toBe(99994999);
  });

  it("limit includes broken lifts", async () => {
    await prisma.resort.update({ where: { id: resortId }, data: { moneyCents: 99999999 } });
    await prisma.lift.createMany({
      data: [
        {
          resortId,
          liftModelKey: "magic_carpet",
          name: "Magic One",
          status: "working",
          breakCount: 0,
        },
        {
          resortId,
          liftModelKey: "magic_carpet",
          name: "Magic Two",
          status: "working",
          breakCount: 0,
        },
        {
          resortId,
          liftModelKey: "magic_carpet",
          name: "Magic Three",
          status: "working",
          breakCount: 0,
        },
        {
          resortId,
          liftModelKey: "magic_carpet",
          name: "Magic Four",
          status: "broken",
          breakCount: 1,
        },
      ],
    });

    const res = await agent.post("/api/buy_lift").send({ liftModelKey: "magic_carpet" });
    expect(res.status).toBe(200);

    const ownedMagicCarpets = res.body.lifts.filter(
      (l: { liftModelKey: string; status: string }) =>
        l.liftModelKey === "magic_carpet" && (l.status === "working" || l.status === "broken")
    );
    expect(ownedMagicCarpets).toHaveLength(4);
    expect(res.body.resort.moneyCents).toBe(99999999);
  });

  it("junked lifts do not count toward the cap", async () => {
    // cable_car maxOwned=1; seed one junked — should still be able to buy one
    await prisma.lift.create({
      data: {
        resortId,
        liftModelKey: "cable_car",
        name: "Junked Cable Car",
        status: "junked",
        breakCount: 5,
      },
    });
    await prisma.resort.update({ where: { id: resortId }, data: { moneyCents: 99999999 } });
    const res = await agent.post("/api/buy_lift").send({ liftModelKey: "cable_car" });
    expect(res.status).toBe(200);
    const activeCableCars = res.body.lifts.filter(
      (l: { liftModelKey: string; status: string }) =>
        l.liftModelKey === "cable_car" && l.status !== "junked"
    );
    expect(activeCableCars).toHaveLength(1);
  });

  it("if a lift becomes junked, a new one can be purchased", async () => {
    await prisma.lift.create({
      data: {
        resortId,
        liftModelKey: "cable_car",
        name: "Retired Cable Car",
        status: "junked",
        breakCount: 5,
      },
    });
    await prisma.resort.update({ where: { id: resortId }, data: { moneyCents: 99999999 } });

    const res = await agent.post("/api/buy_lift").send({ liftModelKey: "cable_car" });
    expect(res.status).toBe(200);

    const nonJunkedCableCars = res.body.lifts.filter(
      (l: { liftModelKey: string; status: string }) =>
        l.liftModelKey === "cable_car" && (l.status === "working" || l.status === "broken")
    );
    expect(nonJunkedCableCars).toHaveLength(1);
    expect(res.body.resort.moneyCents).toBe(94999999);
  });
});
