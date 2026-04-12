-- Add firstLoginAt column to User table
ALTER TABLE "User" ADD COLUMN "firstLoginAt" TIMESTAMP(3);

-- Backfill existing users: treat them as having already logged in
UPDATE "User" SET "firstLoginAt" = NOW() WHERE "firstLoginAt" IS NULL;
