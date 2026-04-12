import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { app } from "../index";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("PATCH /api/rename", () => {
  let userId: string;
  let resortId: string;
  let agent: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    const username = `renametest_${Date.now()}_${String(Math.random()).slice(2)}`;
    const passwordHash = await bcrypt.hash("test-password", 1);
    const user = await prisma.user.create({
      data: { username, passwordHash, role: "USER" },
    });
    userId = user.id;

    const resort = await prisma.resort.create({
      data: { name: "Original Name", userId, moneyCents: 500, lastTickAt: new Date() },
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

  it("renames the resort with a valid name", async () => {
    const res = await agent.patch("/api/rename").send({ name: "Nouvelle Station" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Nouvelle Station");

    const updated = await prisma.resort.findUnique({ where: { id: resortId } });
    expect(updated!.name).toBe("Nouvelle Station");
  });

  it("returns 400 for an empty name", async () => {
    const res = await agent.patch("/api/rename").send({ name: "" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/empty/i);
  });

  it("returns 400 for a name exceeding 30 characters", async () => {
    const res = await agent.patch("/api/rename").send({ name: "A".repeat(31) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/30 characters/i);
  });

  it("returns 401 if not authenticated", async () => {
    const res = await request(app).patch("/api/rename").send({ name: "Hack" });
    expect(res.status).toBe(401);
  });
});
