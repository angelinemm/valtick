import { describe, it, expect } from "vitest";
import { calculateSummary } from "../services/summaryService";

describe("calculateSummary", () => {
  it("empty lifts: base pass price, zero capacity and income", () => {
    const result = calculateSummary(500, []);
    expect(result.passPriceCents).toBe(100);
    expect(result.capacityPerSec).toBe(0);
    expect(result.incomePerSecCents).toBe(0);
    expect(result.totalLifts).toBe(0);
    expect(result.brokenLiftsCount).toBe(0);
    expect(result.junkedLiftsCount).toBe(0);
  });

  it("one working magic_carpet: correct capacity, pass price, income", () => {
    const result = calculateSummary(1000, [
      { status: "working", liftModelKey: "magic_carpet" },
    ]);
    expect(result.capacityPerSec).toBe(5);
    expect(result.passPriceCents).toBe(110); // 100 base + 10 bonus
    expect(result.incomePerSecCents).toBe(550); // 5 * 110
  });

  it("one broken magic_carpet: contributes nothing", () => {
    const result = calculateSummary(1000, [
      { status: "broken", liftModelKey: "magic_carpet" },
    ]);
    expect(result.capacityPerSec).toBe(0);
    expect(result.passPriceCents).toBe(100);
    expect(result.incomePerSecCents).toBe(0);
  });

  it("one junked magic_carpet: contributes nothing", () => {
    const result = calculateSummary(1000, [
      { status: "junked", liftModelKey: "magic_carpet" },
    ]);
    expect(result.capacityPerSec).toBe(0);
    expect(result.passPriceCents).toBe(100);
    expect(result.incomePerSecCents).toBe(0);
  });

  it("working magic_carpet + broken chairlift: only working contributes", () => {
    const result = calculateSummary(1000, [
      { status: "working", liftModelKey: "magic_carpet" },
      { status: "broken", liftModelKey: "chairlift" },
    ]);
    expect(result.capacityPerSec).toBe(5);
    expect(result.passPriceCents).toBe(110);
    expect(result.incomePerSecCents).toBe(550);
  });

  it("two working magic_carpets: capacity and bonus stack", () => {
    const result = calculateSummary(1000, [
      { status: "working", liftModelKey: "magic_carpet" },
      { status: "working", liftModelKey: "magic_carpet" },
    ]);
    expect(result.capacityPerSec).toBe(10);
    expect(result.passPriceCents).toBe(120); // 100 + 10 + 10
    expect(result.incomePerSecCents).toBe(1200); // 10 * 120
  });

  it("one working cable_car: correct values", () => {
    const result = calculateSummary(1000, [
      { status: "working", liftModelKey: "cable_car" },
    ]);
    expect(result.capacityPerSec).toBe(100);
    expect(result.passPriceCents).toBe(300); // 100 + 200
    expect(result.incomePerSecCents).toBe(30000); // 100 * 300
  });

  it("totalLifts counts working, broken, and junked", () => {
    const result = calculateSummary(1000, [
      { status: "working", liftModelKey: "magic_carpet" },
      { status: "broken", liftModelKey: "drag_lift" },
      { status: "junked", liftModelKey: "chairlift" },
    ]);
    expect(result.totalLifts).toBe(3);
  });

  it("brokenLiftsCount counts only broken", () => {
    const result = calculateSummary(1000, [
      { status: "working", liftModelKey: "magic_carpet" },
      { status: "broken", liftModelKey: "drag_lift" },
      { status: "broken", liftModelKey: "chairlift" },
      { status: "junked", liftModelKey: "gondola" },
    ]);
    expect(result.brokenLiftsCount).toBe(2);
  });

  it("junkedLiftsCount counts only junked", () => {
    const result = calculateSummary(1000, [
      { status: "working", liftModelKey: "magic_carpet" },
      { status: "broken", liftModelKey: "drag_lift" },
      { status: "junked", liftModelKey: "gondola" },
      { status: "junked", liftModelKey: "cable_car" },
    ]);
    expect(result.junkedLiftsCount).toBe(2);
  });

  it("moneyCents passes through unchanged", () => {
    const result = calculateSummary(9999, []);
    expect(result.moneyCents).toBe(9999);
  });
});
