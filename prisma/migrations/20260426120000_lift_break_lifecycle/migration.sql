ALTER TABLE "Lift" ADD COLUMN "breakCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "Lift"
SET "breakCount" = LEAST(
  5,
  GREATEST(
    0,
    ROUND(LOG(2, "currentBreakProbability" / 0.002))::INTEGER
  )
)
WHERE "currentBreakProbability" > 0;

ALTER TABLE "Lift" DROP COLUMN "currentBreakProbability";
