import "./types/express-augment";
import path from "path";
import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { resortRouter } from "./routes/resort";
import { authRouter } from "./routes/auth";
import { adminRouter } from "./routes/admin";
import { requireAuth } from "./middleware/requireAuth";

const PgStore = connectPgSimple(session);
const isProd = process.env.NODE_ENV === "production";

const app = express();

if (!isProd) {
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
      credentials: true,
    })
  );
}

app.use(express.json());

app.use(
  session({
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET ?? "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
    },
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);

app.use(requireAuth);

app.use("/api/admin", adminRouter);
app.use("/api", resortRouter);

if (isProd) {
  const staticPath = path.join(__dirname, "..", "static");
  app.use(express.static(staticPath));
  app.get(/^(?!\/api)/, (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

export { app };
