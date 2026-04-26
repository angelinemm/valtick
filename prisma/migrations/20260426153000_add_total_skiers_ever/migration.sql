-- Add total skiers lifetime counter for each resort.
ALTER TABLE "Resort"
ADD COLUMN "totalSkiersEver" INTEGER NOT NULL DEFAULT 0;
