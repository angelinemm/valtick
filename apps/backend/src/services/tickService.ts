import type { LiftModelKey, LiftStatus } from "@val-tick/shared";
import { getLiftModel } from "../catalog/liftModelCatalog";
import { calculateSummary } from "./summaryService";

export type LiftTickState = {
  id: string;
  liftModelKey: LiftModelKey;
  status: LiftStatus;
  breakCount: number;
};

export type TickResult = {
  updatedMoneyCents: number;
  updatedTotalSkiersEver: number;
  updatedLifts: LiftTickState[];
};

export function calculateBreakChance(lift: LiftTickState): number {
  const model = getLiftModel(lift.liftModelKey);
  const progress = lift.breakCount / model.maxRepairableBreaks;

  return (
    model.baseBreakChance + (model.maxBreakChance - model.baseBreakChance) * Math.pow(progress, 2)
  );
}

export function processOneTick(
  moneyCents: number,
  totalSkiersEver: number,
  lifts: LiftTickState[],
  random: () => number = Math.random
): TickResult {
  // Step 1 & 2: calculate income from working lifts BEFORE any breaks
  const { incomePerSecCents, capacityPerSec } = calculateSummary(moneyCents, lifts);

  // Step 3: add income, capped at Postgres INT max (2^31 - 1)
  const MONEY_CAP = 2_147_483_647;
  const updatedMoneyCents = Math.min(moneyCents + incomePerSecCents, MONEY_CAP);
  const updatedTotalSkiersEver = Math.min(totalSkiersEver + capacityPerSec, MONEY_CAP);

  // Step 4: roll for breaks on working lifts only
  const updatedLifts = lifts.map((lift) => {
    if (lift.status !== "working") {
      return { ...lift };
    }

    const roll = random();
    if (roll >= calculateBreakChance(lift)) {
      return { ...lift };
    }

    if (lift.breakCount >= getLiftModel(lift.liftModelKey).maxRepairableBreaks) {
      return { ...lift, status: "junked" as LiftStatus };
    }

    return {
      ...lift,
      status: "broken" as LiftStatus,
      breakCount: lift.breakCount + 1,
    };
  });

  return { updatedMoneyCents, updatedTotalSkiersEver, updatedLifts };
}
