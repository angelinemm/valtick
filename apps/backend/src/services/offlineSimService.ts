import { processOneTick } from "./tickService";
import type { LiftTickState } from "./tickService";

export type OfflineSimInput = {
  moneyCents: number;
  lifts: LiftTickState[];
  lastTickAt: Date;
  now?: Date;
  random?: () => number;
};

export type OfflineSimResult = {
  updatedMoneyCents: number;
  updatedLifts: LiftTickState[];
  ticksSimulated: number;
};

function allInactive(lifts: LiftTickState[]): boolean {
  return lifts.length > 0 && lifts.every((l) => l.status !== "working");
}

export function simulateOfflineTicks(input: OfflineSimInput): OfflineSimResult {
  const now = input.now ?? new Date();
  const random = input.random ?? Math.random;

  const elapsedMs = now.getTime() - input.lastTickAt.getTime();
  const ticksToSimulate = Math.floor(elapsedMs / 1000);

  let moneyCents = input.moneyCents;
  let lifts = input.lifts.map((l) => ({ ...l }));
  let ticksSimulated = 0;

  for (let i = 0; i < ticksToSimulate; i++) {
    if (allInactive(lifts)) break;

    const result = processOneTick(moneyCents, lifts, random);
    moneyCents = result.updatedMoneyCents;
    lifts = result.updatedLifts;
    ticksSimulated++;
  }

  return { updatedMoneyCents: moneyCents, updatedLifts: lifts, ticksSimulated };
}
