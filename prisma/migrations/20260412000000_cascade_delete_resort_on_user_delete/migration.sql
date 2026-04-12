-- Change Resort.userId foreign key from SET NULL to CASCADE
-- so that deleting a user also deletes their resort (and lifts, via existing cascade)

ALTER TABLE "Resort" DROP CONSTRAINT "Resort_userId_fkey";

ALTER TABLE "Resort" ADD CONSTRAINT "Resort_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
