import { describe, it, expect } from "vitest";
import { simulateOfflineTicks } from "../services/offlineSimService";
import type { LiftTickState } from "../services/tickService";

const neverBreaks = () => 1;
const alwaysBreaks = () => 0;

const BASE_TIME = new Date("2026-01-01T12:00:00.000Z");

function makeWorkingLift(id = "lift-1"): LiftTickState {
  return {
    id,
    liftModelKey: "magic_carpet",
    status: "working",
    currentBreakProbability: 0.001,
  };
}

function secondsLater(seconds: number): Date {
  return new Date(BASE_TIME.getTime() + seconds * 1000);
}

describe("simulateOfflineTicks", () => {
  it("zero elapsed time: ticksSimulated=0, money unchanged", () => {
    const result = simulateOfflineTicks({
      moneyCents: 1000,
      lifts: [makeWorkingLift()],
      lastTickAt: BASE_TIME,
      now: BASE_TIME,
      random: neverBreaks,
    });
    expect(result.ticksSimulated).toBe(0);
    expect(result.updatedMoneyCents).toBe(1000);
  });

  it("3 seconds elapsed, no breaks: simulates 3 ticks, income accumulates", () => {
    // magic_carpet: 100 cents per tick (5 capacity * 20 pass price)
    const result = simulateOfflineTicks({
      moneyCents: 0,
      lifts: [makeWorkingLift()],
      lastTickAt: BASE_TIME,
      now: secondsLater(3),
      random: neverBreaks,
    });
    expect(result.ticksSimulated).toBe(3);
    expect(result.updatedMoneyCents).toBe(300); // 3 * 100
  });

  it("partial second is floored: 3.9 seconds → 3 ticks", () => {
    const result = simulateOfflineTicks({
      moneyCents: 0,
      lifts: [makeWorkingLift()],
      lastTickAt: BASE_TIME,
      now: new Date(BASE_TIME.getTime() + 3900),
      random: neverBreaks,
    });
    expect(result.ticksSimulated).toBe(3);
  });

  it("early stop: lift breaks on tick 1 with alwaysBreaks, ticks 2-5 skipped", () => {
    const result = simulateOfflineTicks({
      moneyCents: 0,
      lifts: [makeWorkingLift()],
      lastTickAt: BASE_TIME,
      now: secondsLater(5),
      random: alwaysBreaks,
    });
    expect(result.ticksSimulated).toBe(1);
    expect(result.updatedLifts[0].status).toBe("broken");
  });

  it("all lifts already broken at start: ticksSimulated=0, money unchanged", () => {
    const result = simulateOfflineTicks({
      moneyCents: 500,
      lifts: [{ ...makeWorkingLift(), status: "broken" }],
      lastTickAt: BASE_TIME,
      now: secondsLater(10),
      random: neverBreaks,
    });
    expect(result.ticksSimulated).toBe(0);
    expect(result.updatedMoneyCents).toBe(500);
  });

  it("all lifts already junked at start: ticksSimulated=0, money unchanged", () => {
    const result = simulateOfflineTicks({
      moneyCents: 500,
      lifts: [{ ...makeWorkingLift(), status: "junked" }],
      lastTickAt: BASE_TIME,
      now: secondsLater(10),
      random: neverBreaks,
    });
    expect(result.ticksSimulated).toBe(0);
    expect(result.updatedMoneyCents).toBe(500);
  });

  it("1 working + 1 broken, alwaysBreaks: working breaks tick 1, stops", () => {
    const result = simulateOfflineTicks({
      moneyCents: 0,
      lifts: [
        makeWorkingLift("working-lift"),
        { ...makeWorkingLift("broken-lift"), status: "broken" },
      ],
      lastTickAt: BASE_TIME,
      now: secondsLater(5),
      random: alwaysBreaks,
    });
    expect(result.ticksSimulated).toBe(1);
    expect(result.updatedLifts.every((l) => l.status !== "working")).toBe(true);
  });

  it("empty lifts array: ticksSimulated equals elapsed seconds (no early stop)", () => {
    // allInactive requires lifts.length > 0, so empty array never triggers early stop
    const result = simulateOfflineTicks({
      moneyCents: 100,
      lifts: [],
      lastTickAt: BASE_TIME,
      now: secondsLater(3),
      random: neverBreaks,
    });
    expect(result.ticksSimulated).toBe(3);
    expect(result.updatedMoneyCents).toBe(100); // no lifts = no income
  });
});
