-- Drop the guestId column — auth is now session-based, guestId is no longer used
DROP INDEX IF EXISTS "Resort_guestId_key";
ALTER TABLE "Resort" DROP COLUMN IF EXISTS "guestId";
