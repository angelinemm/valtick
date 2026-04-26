ALTER TABLE "Lift" ADD COLUMN "breakCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "Lift"
SET "breakCount" = LEAST(
  5,
  GREATEST(
    0,
    ROUND(LN("currentBreakProbability" / 0.002) / LN(2.0))::INTEGER
  )
)
WHERE "currentBreakProbability" > 0;

ALTER TABLE "Lift" DROP COLUMN "currentBreakProbability";
