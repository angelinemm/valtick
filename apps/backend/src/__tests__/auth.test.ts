import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { app } from "../index";
import { prisma } from "../db/prisma";

const HAS_DB = !!process.env.DATABASE_URL;

describe.skipIf(!HAS_DB)("Auth routes", () => {
  let userId: string;
  let resortId: string;
  let userEmail: string;

  beforeEach(async () => {
    userEmail = `auth-test-${Date.now()}-${Math.random()}@example.com`;
    const passwordHash = await bcrypt.hash("correct-password", 1);
    const user = await prisma.user.create({
      data: { email: userEmail, passwordHash, role: "USER" },
    });
    userId = user.id;

    const resort = await prisma.resort.create({
      data: { name: "Auth Test Resort", userId, moneyCents: 1000, lastTickAt: new Date() },
    });
    resortId = resort.id;
  });

  afterEach(async () => {
    await prisma.resort.deleteMany({ where: { id: resortId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /auth/login", () => {
    it("succeeds with correct credentials and sets a cookie", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: userEmail, password: "correct-password" });
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(userEmail);
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("returns 401 with wrong password", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: userEmail, password: "wrong-password" });
      expect(res.status).toBe(401);
    });

    it("returns 401 with unknown email", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "nobody@example.com", password: "correct-password" });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /auth/me", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await request(app).get("/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns user info when authenticated", async () => {
      const agent = request.agent(app);
      await agent.post("/auth/login").send({ email: userEmail, password: "correct-password" });
      const res = await agent.get("/auth/me");
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(userEmail);
    });
  });

  describe("POST /auth/logout", () => {
    it("clears the session and subsequent requests return 401", async () => {
      const agent = request.agent(app);
      await agent.post("/auth/login").send({ email: userEmail, password: "correct-password" });

      // Confirm we're logged in
      const meRes = await agent.get("/auth/me");
      expect(meRes.status).toBe(200);

      // Logout
      const logoutRes = await agent.post("/auth/logout");
      expect(logoutRes.status).toBe(200);

      // Should now be 401
      const afterRes = await agent.get("/resort");
      expect(afterRes.status).toBe(401);
    });
  });

  describe("Protected routes without session", () => {
    it("GET /resort returns 401 without authentication", async () => {
      const res = await request(app).get("/resort");
      expect(res.status).toBe(401);
    });

    it("POST /tick returns 401 without authentication", async () => {
      const res = await request(app).post("/tick").send({});
      expect(res.status).toBe(401);
    });
  });

  describe("GET /resort with valid session", () => {
    it("returns 200 with the user's resort", async () => {
      const agent = request.agent(app);
      await agent.post("/auth/login").send({ email: userEmail, password: "correct-password" });
      const res = await agent.get("/resort");
      expect(res.status).toBe(200);
      expect(res.body.resort.name).toBe("Auth Test Resort");
    });
  });
});
