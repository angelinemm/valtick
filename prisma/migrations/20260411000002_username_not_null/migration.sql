-- Remove users without a username (dev environment: no production users exist yet)
DELETE FROM "User" WHERE "username" IS NULL;

-- Enforce NOT NULL now that all rows have a username
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
