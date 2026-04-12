import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { app } from "../index";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("POST /api/profile/change-password", () => {
  let userId: string;
  let username: string;
  let agent: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    username = `profiletest_${Date.now()}_${String(Math.random()).slice(2)}`;
    const passwordHash = await bcrypt.hash("OldPassword1!", 1);
    const user = await prisma.user.create({
      data: { username, passwordHash, role: "USER" },
    });
    userId = user.id;

    agent = request.agent(app);
    await agent.post("/api/auth/login").send({ username, password: "OldPassword1!" });
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("succeeds with valid current password and valid new password", async () => {
    const res = await agent
      .post("/api/profile/change-password")
      .send({ currentPassword: "OldPassword1!", newPassword: "NewSecret9#" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const updated = await prisma.user.findUnique({ where: { id: userId } });
    const match = await bcrypt.compare("NewSecret9#", updated!.passwordHash);
    expect(match).toBe(true);
  });

  it("returns 400 if current password is wrong", async () => {
    const res = await agent
      .post("/api/profile/change-password")
      .send({ currentPassword: "WrongPassword1!", newPassword: "NewSecret9#" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Current password is incorrect");
  });

  it("returns 400 if new password is too short", async () => {
    const res = await agent
      .post("/api/profile/change-password")
      .send({ currentPassword: "OldPassword1!", newPassword: "Ab1!" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 8 characters/);
  });

  it("returns 400 if new password has no number or special character", async () => {
    const res = await agent
      .post("/api/profile/change-password")
      .send({ currentPassword: "OldPassword1!", newPassword: "alllettersonly" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/number or special character/);
  });

  it("returns 401 if not authenticated", async () => {
    const res = await request(app)
      .post("/api/profile/change-password")
      .send({ currentPassword: "OldPassword1!", newPassword: "NewSecret9#" });
    expect(res.status).toBe(401);
  });
});
