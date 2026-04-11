import { describe, it, expect } from "vitest";
import { processOneTick } from "../services/tickService";
import type { LiftTickState } from "../services/tickService";

const alwaysBreaks = () => 0;
const neverBreaks = () => 1;

function makeLift(
  overrides: Partial<LiftTickState> = {}
): LiftTickState {
  return {
    id: "lift-1",
    liftModelKey: "magic_carpet",
    status: "working",
    currentBreakProbability: 0.001,
    ...overrides,
  };
}

describe("income calculation", () => {
  it("one working magic_carpet adds 100 cents", () => {
    const { updatedMoneyCents } = processOneTick(
      1000,
      [makeLift()],
      neverBreaks
    );
    expect(updatedMoneyCents).toBe(1100);
  });

  it("one broken lift: money unchanged", () => {
    const { updatedMoneyCents } = processOneTick(
      1000,
      [makeLift({ status: "broken" })],
      alwaysBreaks
    );
    expect(updatedMoneyCents).toBe(1000);
  });

  it("no lifts: money unchanged", () => {
    const { updatedMoneyCents } = processOneTick(1000, [], alwaysBreaks);
    expect(updatedMoneyCents).toBe(1000);
  });

  it("two working magic_carpets adds 300 cents", () => {
    const { updatedMoneyCents } = processOneTick(
      0,
      [makeLift({ id: "a" }), makeLift({ id: "b" })],
      neverBreaks
    );
    // capacity=10, passPriceCents=10+10+10=30, income=10*30=300
    expect(updatedMoneyCents).toBe(300);
  });
});

describe("break behaviour", () => {
  it("working lift with alwaysBreaks becomes broken, probability doubles", () => {
    const lift = makeLift({ currentBreakProbability: 0.001 });
    const { updatedLifts } = processOneTick(0, [lift], alwaysBreaks);
    expect(updatedLifts[0].status).toBe("broken");
    expect(updatedLifts[0].currentBreakProbability).toBe(0.002);
  });

  it("working lift with neverBreaks stays working, probability unchanged", () => {
    const lift = makeLift({ currentBreakProbability: 0.001 });
    const { updatedLifts } = processOneTick(0, [lift], neverBreaks);
    expect(updatedLifts[0].status).toBe("working");
    expect(updatedLifts[0].currentBreakProbability).toBe(0.001);
  });

  it("broken lift is not rolled — alwaysBreaks does not affect it", () => {
    const lift = makeLift({ status: "broken", currentBreakProbability: 0.001 });
    const { updatedLifts } = processOneTick(0, [lift], alwaysBreaks);
    expect(updatedLifts[0].status).toBe("broken");
    expect(updatedLifts[0].currentBreakProbability).toBe(0.001);
  });

  it("junked lift is not rolled — alwaysBreaks does not affect it", () => {
    const lift = makeLift({ status: "junked", currentBreakProbability: 0.001 });
    const { updatedLifts } = processOneTick(0, [lift], alwaysBreaks);
    expect(updatedLifts[0].status).toBe("junked");
  });
});

describe("junk boundary", () => {
  it("breaks at probability 0.5 → broken with probability 1.0 (not junked)", () => {
    // probability was < 1.0 before the break, so: broken + double
    const lift = makeLift({ currentBreakProbability: 0.5 });
    const { updatedLifts } = processOneTick(0, [lift], alwaysBreaks);
    expect(updatedLifts[0].status).toBe("broken");
    expect(updatedLifts[0].currentBreakProbability).toBe(1.0);
  });

  it("breaks at probability 1.0 → junked", () => {
    const lift = makeLift({ currentBreakProbability: 1.0 });
    const { updatedLifts } = processOneTick(0, [lift], alwaysBreaks);
    expect(updatedLifts[0].status).toBe("junked");
  });

  it("breaks at probability 2.0 → junked", () => {
    const lift = makeLift({ currentBreakProbability: 2.0 });
    const { updatedLifts } = processOneTick(0, [lift], alwaysBreaks);
    expect(updatedLifts[0].status).toBe("junked");
  });
});

describe("tick ordering", () => {
  it("a lift that breaks this tick still contributed income this tick", () => {
    // magic_carpet: income = 5 * 20 = 100 — earned before break roll
    const lift = makeLift({ currentBreakProbability: 0.001 });
    const { updatedMoneyCents, updatedLifts } = processOneTick(
      0,
      [lift],
      alwaysBreaks
    );
    expect(updatedLifts[0].status).toBe("broken");
    expect(updatedMoneyCents).toBe(100);
  });
});

describe("immutability", () => {
  it("does not mutate the input lifts array", () => {
    const lift = makeLift({ currentBreakProbability: 0.001 });
    const original = { ...lift };
    processOneTick(0, [lift], alwaysBreaks);
    expect(lift).toEqual(original);
  });

  it("returned lifts carry the correct IDs", () => {
    const lifts = [
      makeLift({ id: "aaa" }),
      makeLift({ id: "bbb", status: "broken" }),
    ];
    const { updatedLifts } = processOneTick(0, lifts, neverBreaks);
    expect(updatedLifts[0].id).toBe("aaa");
    expect(updatedLifts[1].id).toBe("bbb");
  });
});
