import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { app } from "../index";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("Admin routes", () => {
  let adminAgent: ReturnType<typeof request.agent>;
  let userAgent: ReturnType<typeof request.agent>;
  let adminId: string;
  let userId: string;
  let adminUsername: string;
  let userUsername: string;

  beforeEach(async () => {
    adminUsername = `admin_${Date.now()}_${String(Math.random()).slice(2)}`;
    userUsername = `user_${Date.now()}_${String(Math.random()).slice(2)}`;
    const passwordHash = await bcrypt.hash("test-password", 1);

    const admin = await prisma.user.create({
      data: { username: adminUsername, passwordHash, role: "ADMIN" },
    });
    adminId = admin.id;

    const user = await prisma.user.create({
      data: { username: userUsername, passwordHash, role: "USER" },
    });
    userId = user.id;

    adminAgent = request.agent(app);
    await adminAgent
      .post("/api/auth/login")
      .send({ username: adminUsername, password: "test-password" });

    userAgent = request.agent(app);
    await userAgent
      .post("/api/auth/login")
      .send({ username: userUsername, password: "test-password" });
  });

  afterEach(async () => {
    await prisma.resort.deleteMany({ where: { userId: { in: [adminId, userId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [adminId, userId] } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Access control", () => {
    it("returns 401 for unauthenticated request", async () => {
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBe(401);
    });

    it("returns 403 for non-admin user", async () => {
      const res = await userAgent.get("/api/admin/users");
      expect(res.status).toBe(403);
    });

    it("returns 200 for admin user", async () => {
      const res = await adminAgent.get("/api/admin/users");
      expect(res.status).toBe(200);
    });
  });

  describe("GET /admin/users", () => {
    it("returns list of users", async () => {
      const res = await adminAgent.get("/api/admin/users");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
      const usernames = res.body.users.map((u: { username: string }) => u.username);
      expect(usernames).toContain(adminUsername);
      expect(usernames).toContain(userUsername);
    });

    it("includes resort info (null when no resort)", async () => {
      const res = await adminAgent.get("/api/admin/users");
      const found = res.body.users.find((u: { username: string }) => u.username === userUsername);
      expect(found.resort).toBeNull();
    });

    it("includes resort summary when resort exists", async () => {
      await prisma.resort.create({
        data: {
          name: "Test Resort",
          userId,
          moneyCents: 1000,
          lastTickAt: new Date(),
          lifts: {
            create: {
              liftModelKey: "magic_carpet",
              name: "Test Lift",
              status: "working",
              currentBreakProbability: 0.002,
            },
          },
        },
      });
      const res = await adminAgent.get("/api/admin/users");
      const found = res.body.users.find((u: { username: string }) => u.username === userUsername);
      expect(found.resort.name).toBe("Test Resort");
      expect(found.resort.moneyCents).toBe(1000);
      expect(found.resort.liftsCount).toBe(1);
    });

    it("counts only working lifts in the resort summary", async () => {
      await prisma.resort.create({
        data: {
          name: "Test Resort",
          userId,
          moneyCents: 1000,
          lastTickAt: new Date(),
          lifts: {
            create: [
              {
                liftModelKey: "magic_carpet",
                name: "Working Lift",
                status: "working",
                currentBreakProbability: 0.002,
              },
              {
                liftModelKey: "chairlift",
                name: "Broken Lift",
                status: "broken",
                currentBreakProbability: 0.1,
              },
              {
                liftModelKey: "gondola",
                name: "Junked Lift",
                status: "junked",
                currentBreakProbability: 1,
              },
            ],
          },
        },
      });

      const res = await adminAgent.get("/api/admin/users");
      const found = res.body.users.find((u: { username: string }) => u.username === userUsername);
      expect(found.resort.liftsCount).toBe(1);
    });
  });

  describe("POST /admin/users", () => {
    let createdUserId: string | undefined;

    afterEach(async () => {
      if (createdUserId) {
        await prisma.resort.deleteMany({ where: { userId: createdUserId } });
        await prisma.user.deleteMany({ where: { id: createdUserId } });
        createdUserId = undefined;
      }
    });

    it("creates user and resort, returns generated password", async () => {
      const newUsername = `newuser_${Date.now()}`;
      const res = await adminAgent.post("/api/admin/users").send({ username: newUsername });
      expect(res.status).toBe(201);
      expect(res.body.user.username).toBe(newUsername);
      expect(typeof res.body.password).toBe("string");
      expect(res.body.password).toMatch(/^[a-z]+-[a-z]+-[a-z]+-\d$/);
      createdUserId = res.body.user.id;
    });

    it("creates a resort in starting state for the new user", async () => {
      const newUsername = `newuser_${Date.now()}`;
      const res = await adminAgent.post("/api/admin/users").send({ username: newUsername });
      createdUserId = res.body.user.id;

      expect(typeof res.body.user.resort.name).toBe("string");
      expect(res.body.user.resort.name.length).toBeGreaterThan(0);
      expect(res.body.user.resort.moneyCents).toBe(500);
      expect(res.body.user.resort.liftsCount).toBe(1);
    });

    it("generated password is correctly hashed in DB", async () => {
      const newUsername = `newuser_${Date.now()}`;
      const res = await adminAgent.post("/api/admin/users").send({ username: newUsername });
      createdUserId = res.body.user.id;

      const dbUser = await prisma.user.findUnique({ where: { id: createdUserId } });
      const match = await bcrypt.compare(res.body.password, dbUser!.passwordHash);
      expect(match).toBe(true);
    });

    it("returns 400 if username is missing", async () => {
      const res = await adminAgent.post("/api/admin/users").send({});
      expect(res.status).toBe(400);
    });

    it("returns 403 for non-admin", async () => {
      const res = await userAgent.post("/api/admin/users").send({ username: "x" });
      expect(res.status).toBe(403);
    });
  });

  describe("POST /admin/users/:id/reset-password", () => {
    it("returns a new generated password", async () => {
      const res = await adminAgent.post(`/api/admin/users/${userId}/reset-password`);
      expect(res.status).toBe(200);
      expect(typeof res.body.password).toBe("string");
      expect(res.body.password).toMatch(/^[a-z]+-[a-z]+-[a-z]+-\d$/);
    });

    it("new password is correctly hashed in DB", async () => {
      const res = await adminAgent.post(`/api/admin/users/${userId}/reset-password`);
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      const match = await bcrypt.compare(res.body.password, dbUser!.passwordHash);
      expect(match).toBe(true);
    });

    it("returns 403 for non-admin", async () => {
      const res = await userAgent.post(`/api/admin/users/${userId}/reset-password`);
      expect(res.status).toBe(403);
    });
  });

  describe("POST /admin/users/:id/reset-resort", () => {
    it("resets resort to starting state", async () => {
      await prisma.resort.create({
        data: {
          name: "Rich Resort",
          userId,
          moneyCents: 99999,
          lastTickAt: new Date(),
          lifts: {
            create: [
              {
                liftModelKey: "magic_carpet",
                name: "Test Carpet",
                status: "working",
                currentBreakProbability: 0.002,
              },
              {
                liftModelKey: "chairlift",
                name: "Test Chair",
                status: "broken",
                currentBreakProbability: 0.1,
              },
            ],
          },
        },
      });

      const res = await adminAgent.post(`/api/admin/users/${userId}/reset-resort`);
      expect(res.status).toBe(200);

      const resort = await prisma.resort.findUnique({
        where: { userId },
        include: { lifts: true },
      });
      expect(resort!.moneyCents).toBe(500);
      expect(resort!.lifts).toHaveLength(1);
      expect(resort!.lifts[0].liftModelKey).toBe("magic_carpet");
      expect(resort!.lifts[0].status).toBe("working");
    });

    it("creates a resort if the user has none", async () => {
      const res = await adminAgent.post(`/api/admin/users/${userId}/reset-resort`);
      expect(res.status).toBe(200);

      const resort = await prisma.resort.findUnique({ where: { userId } });
      expect(resort).not.toBeNull();
      expect(resort!.moneyCents).toBe(500);
    });

    it("returns 403 for non-admin", async () => {
      const res = await userAgent.post(`/api/admin/users/${userId}/reset-resort`);
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /admin/users/:id", () => {
    it("admin can delete a regular user", async () => {
      const res = await adminAgent.delete(`/api/admin/users/${userId}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      const gone = await prisma.user.findUnique({ where: { id: userId } });
      expect(gone).toBeNull();
      userId = ""; // already deleted — skip afterEach cleanup
    });

    it("deleting a user cascades to their resort and lifts", async () => {
      const resort = await prisma.resort.create({
        data: {
          name: "Doomed Resort",
          userId,
          moneyCents: 1000,
          lastTickAt: new Date(),
          lifts: {
            create: {
              liftModelKey: "magic_carpet",
              name: "Doomed Carpet",
              status: "working",
              currentBreakProbability: 0.002,
            },
          },
        },
      });

      await adminAgent.delete(`/api/admin/users/${userId}`);

      const goneResort = await prisma.resort.findUnique({ where: { id: resort.id } });
      expect(goneResort).toBeNull();
      const goneLifts = await prisma.lift.findMany({ where: { resortId: resort.id } });
      expect(goneLifts).toHaveLength(0);
      userId = ""; // already deleted — skip afterEach cleanup
    });

    it("returns 403 when trying to delete an admin user", async () => {
      const res = await adminAgent.delete(`/api/admin/users/${adminId}`);
      expect(res.status).toBe(403);
    });

    it("returns 403 when trying to delete yourself", async () => {
      // adminId === req.user.id — self-delete check fires before role check
      const res = await adminAgent.delete(`/api/admin/users/${adminId}`);
      expect(res.status).toBe(403);
    });

    it("returns 404 for unknown user", async () => {
      const res = await adminAgent.delete(`/api/admin/users/nonexistent-id`);
      expect(res.status).toBe(404);
    });

    it("returns 401 if not authenticated as admin", async () => {
      const res = await request(app).delete(`/api/admin/users/${userId}`);
      expect(res.status).toBe(401);
    });
  });
});
