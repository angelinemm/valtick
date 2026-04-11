-- Make email nullable (login now uses username)
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- Add username column (nullable to allow migration of existing rows)
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Add unique constraint for username
ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username");
