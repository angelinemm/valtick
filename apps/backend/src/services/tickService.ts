import type { LiftModelKey, LiftStatus } from "@val-tick/shared";
import { calculateSummary } from "./summaryService";

export type LiftTickState = {
  id: string;
  liftModelKey: LiftModelKey;
  status: LiftStatus;
  currentBreakProbability: number;
};

export type TickResult = {
  updatedMoneyCents: number;
  updatedLifts: LiftTickState[];
};

export function processOneTick(
  moneyCents: number,
  lifts: LiftTickState[],
  random: () => number = Math.random
): TickResult {
  // Step 1 & 2: calculate income from working lifts BEFORE any breaks
  const { incomePerSecCents } = calculateSummary(moneyCents, lifts);

  // Step 3: add income, capped at Postgres INT max (2^31 - 1)
  const MONEY_CAP = 2_147_483_647;
  const updatedMoneyCents = Math.min(moneyCents + incomePerSecCents, MONEY_CAP);

  // Step 4: roll for breaks on working lifts only
  const updatedLifts = lifts.map((lift) => {
    if (lift.status !== "working") {
      return { ...lift };
    }

    const roll = random();
    if (roll >= lift.currentBreakProbability) {
      return { ...lift };
    }

    // Lift breaks — check probability BEFORE doubling to decide working vs junked
    if (lift.currentBreakProbability >= 1.0) {
      return { ...lift, status: "junked" as LiftStatus };
    }

    return {
      ...lift,
      status: "broken" as LiftStatus,
      currentBreakProbability: lift.currentBreakProbability * 2,
    };
  });

  return { updatedMoneyCents, updatedLifts };
}
