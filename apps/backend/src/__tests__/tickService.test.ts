import { describe, it, expect } from "vitest";
import { calculateBreakChance, processOneTick } from "../services/tickService";
import type { LiftTickState } from "../services/tickService";

const alwaysBreaks = () => 0;
const neverBreaks = () => 1;

function makeLift(overrides: Partial<LiftTickState> = {}): LiftTickState {
  return {
    id: "lift-1",
    liftModelKey: "magic_carpet",
    status: "working",
    breakCount: 0,
    ...overrides,
  };
}

describe("income calculation", () => {
  it("one working magic_carpet adds 100 cents", () => {
    const { updatedMoneyCents } = processOneTick(1000, 0, [makeLift()], neverBreaks);
    expect(updatedMoneyCents).toBe(1100);
  });

  it("one broken lift: money unchanged", () => {
    const { updatedMoneyCents } = processOneTick(
      1000,
      0,
      [makeLift({ status: "broken" })],
      alwaysBreaks
    );
    expect(updatedMoneyCents).toBe(1000);
  });

  it("no lifts: money unchanged", () => {
    const { updatedMoneyCents } = processOneTick(1000, 0, [], alwaysBreaks);
    expect(updatedMoneyCents).toBe(1000);
  });

  it("two working magic_carpets adds 300 cents", () => {
    const { updatedMoneyCents } = processOneTick(
      0,
      0,
      [makeLift({ id: "a" }), makeLift({ id: "b" })],
      neverBreaks
    );
    // capacity=10, passPriceCents=10+10+10=30, income=10*30=300
    expect(updatedMoneyCents).toBe(300);
  });
});

describe("break behaviour", () => {
  it("working lift with alwaysBreaks becomes broken and increments breakCount", () => {
    const lift = makeLift({ breakCount: 0 });
    const { updatedLifts } = processOneTick(0, 0, [lift], alwaysBreaks);
    expect(updatedLifts[0].status).toBe("broken");
    expect(updatedLifts[0].breakCount).toBe(1);
  });

  it("working lift with neverBreaks stays working, breakCount unchanged", () => {
    const lift = makeLift({ breakCount: 0 });
    const { updatedLifts } = processOneTick(0, 0, [lift], neverBreaks);
    expect(updatedLifts[0].status).toBe("working");
    expect(updatedLifts[0].breakCount).toBe(0);
  });

  it("broken lift is not rolled — alwaysBreaks does not affect it", () => {
    const lift = makeLift({ status: "broken", breakCount: 2 });
    const { updatedLifts } = processOneTick(0, 0, [lift], alwaysBreaks);
    expect(updatedLifts[0].status).toBe("broken");
    expect(updatedLifts[0].breakCount).toBe(2);
  });

  it("junked lift is not rolled — alwaysBreaks does not affect it", () => {
    const lift = makeLift({ status: "junked", breakCount: 5 });
    const { updatedLifts } = processOneTick(0, 0, [lift], alwaysBreaks);
    expect(updatedLifts[0].status).toBe("junked");
  });
});

describe("junk boundary", () => {
  it("breaks below maxRepairableBreaks → broken and increments breakCount", () => {
    const lift = makeLift({ breakCount: 4 });
    const { updatedLifts } = processOneTick(0, 0, [lift], alwaysBreaks);
    expect(updatedLifts[0].status).toBe("broken");
    expect(updatedLifts[0].breakCount).toBe(5);
  });

  it("breaks at maxRepairableBreaks → junked", () => {
    const lift = makeLift({ breakCount: 5 });
    const { updatedLifts } = processOneTick(0, 0, [lift], alwaysBreaks);
    expect(updatedLifts[0].status).toBe("junked");
    expect(updatedLifts[0].breakCount).toBe(5);
  });

  it("uses quadratic lifecycle progress for break chance", () => {
    expect(calculateBreakChance(makeLift({ breakCount: 0 }))).toBeCloseTo(0.002);
    expect(calculateBreakChance(makeLift({ breakCount: 5 }))).toBeCloseTo(0.064);
    expect(calculateBreakChance(makeLift({ breakCount: 3 }))).toBeCloseTo(0.02432);
  });
});

describe("tick ordering", () => {
  it("a lift that breaks this tick still contributed income this tick", () => {
    // magic_carpet: income = 5 * 20 = 100 — earned before break roll
    const lift = makeLift({ breakCount: 0 });
    const { updatedMoneyCents, updatedLifts } = processOneTick(0, 0, [lift], alwaysBreaks);
    expect(updatedLifts[0].status).toBe("broken");
    expect(updatedMoneyCents).toBe(100);
  });

  it("a lift that breaks this tick still contributed skiers this tick", () => {
    const lift = makeLift({ breakCount: 0 });
    const { updatedTotalSkiersEver, updatedLifts } = processOneTick(0, 10, [lift], alwaysBreaks);
    expect(updatedLifts[0].status).toBe("broken");
    expect(updatedTotalSkiersEver).toBe(15);
  });
});

describe("totalSkiersEver", () => {
  it("increases by working capacity only", () => {
    const { updatedTotalSkiersEver } = processOneTick(
      0,
      100,
      [
        makeLift({ id: "working-1" }),
        makeLift({ id: "working-2" }),
        makeLift({ id: "broken", status: "broken" }),
        makeLift({ id: "junked", status: "junked" }),
      ],
      neverBreaks
    );
    expect(updatedTotalSkiersEver).toBe(110);
  });

  it("persists correctly across ticks", () => {
    const firstTick = processOneTick(0, 0, [makeLift()], neverBreaks);
    const secondTick = processOneTick(
      firstTick.updatedMoneyCents,
      firstTick.updatedTotalSkiersEver,
      firstTick.updatedLifts,
      neverBreaks
    );
    expect(firstTick.updatedTotalSkiersEver).toBe(5);
    expect(secondTick.updatedTotalSkiersEver).toBe(10);
  });
});

describe("immutability", () => {
  it("does not mutate the input lifts array", () => {
    const lift = makeLift({ breakCount: 0 });
    const original = { ...lift };
    processOneTick(0, 0, [lift], alwaysBreaks);
    expect(lift).toEqual(original);
  });

  it("returned lifts carry the correct IDs", () => {
    const lifts = [makeLift({ id: "aaa" }), makeLift({ id: "bbb", status: "broken" })];
    const { updatedLifts } = processOneTick(0, 0, lifts, neverBreaks);
    expect(updatedLifts[0].id).toBe("aaa");
    expect(updatedLifts[1].id).toBe("bbb");
  });
});
