import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import { app } from "../index";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("POST /tick", () => {
  let guestId: string;
  let resortId: string;

  beforeEach(async () => {
    guestId = `test-tick-${Date.now()}-${Math.random()}`;
    const resort = await prisma.resort.create({
      data: {
        name: "Tick Test Resort",
        guestId,
        moneyCents: 1000,
        lastTickAt: new Date(),
        lifts: {
          create: {
            liftModelKey: "magic_carpet",
            status: "working",
            currentBreakProbability: 0.001,
          },
        },
      },
    });
    resortId = resort.id;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await prisma.resort.deleteMany({ where: { id: resortId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 404 for an unknown guestId", async () => {
    const res = await request(app).post("/tick").send({ guestId: "no-such-resort" });
    expect(res.status).toBe(404);
  });

  it("returns { ok: true } for a valid guestId", async () => {
    const res = await request(app).post("/tick").send({ guestId });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("adds income to money after a tick", async () => {
    vi.spyOn(Math, "random").mockReturnValue(1); // no breaks
    await request(app).post("/tick").send({ guestId });

    const res = await request(app).get(`/resort/${guestId}`);
    // magic_carpet: 5 * 20 = 100 cents added to starting 1000
    expect(res.body.resort.moneyCents).toBe(1100);
  });

  it("updates lastTickAt after a tick", async () => {
    const before = Date.now();
    await request(app).post("/tick").send({ guestId });

    const res = await request(app).get(`/resort/${guestId}`);
    const lastTickAt = new Date(res.body.resort.lastTickAt).getTime();
    expect(lastTickAt).toBeGreaterThanOrEqual(before);
  });

  it("lift with probability >= 1.0 becomes junked when break is forced", async () => {
    // Set lift to breakProbability=1.0 first
    await prisma.lift.updateMany({
      where: { resortId },
      data: { currentBreakProbability: 1.0 },
    });

    vi.spyOn(Math, "random").mockReturnValue(0); // force break

    await request(app).post("/tick").send({ guestId });

    const res = await request(app).get(`/resort/${guestId}`);
    expect(res.body.lifts[0].status).toBe("junked");
  });
});
