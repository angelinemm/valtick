import { Pool } from "pg";

/**
 * Runs once in the main vitest process before any worker threads start.
 * Creates the session table used by connect-pg-simple so it exists before
 * the first authenticated request in any test file.
 */
export async function setup() {
  if (!process.env.DATABASE_URL) return;

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      ) WITH (OIDS=FALSE)
    `);

    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "session" ADD CONSTRAINT "session_pkey"
          PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")`);
  } finally {
    await pool.end();
  }
}
