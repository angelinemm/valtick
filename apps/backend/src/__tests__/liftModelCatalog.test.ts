import { describe, it, expect } from "vitest";
import {
  getLiftModel,
  getAllLiftModels,
} from "../catalog/liftModelCatalog";
import type { LiftModelKey } from "@val-tick/shared";

describe("getAllLiftModels", () => {
  it("returns exactly 5 models", () => {
    expect(getAllLiftModels()).toHaveLength(5);
  });

  it("returns a copy, not the internal array", () => {
    const a = getAllLiftModels();
    const b = getAllLiftModels();
    expect(a).not.toBe(b);
  });

  it("is ordered smallest to largest", () => {
    const keys = getAllLiftModels().map((m) => m.key);
    expect(keys).toEqual([
      "magic_carpet",
      "drag_lift",
      "chairlift",
      "gondola",
      "cable_car",
    ]);
  });

  it("every model has initialBreakChance === 0.002", () => {
    getAllLiftModels().forEach((m) => {
      expect(m.initialBreakChance).toBe(0.002);
    });
  });

  it("every model's repairCostCents is 10% of purchasePriceCents", () => {
    getAllLiftModels().forEach((m) => {
      expect(m.repairCostCents).toBe(m.purchasePriceCents / 10);
    });
  });
});

describe("getLiftModel", () => {
  it("returns magic_carpet with correct values", () => {
    const model = getLiftModel("magic_carpet");
    expect(model).toEqual({
      key: "magic_carpet",
      name: "Magic Carpet",
      purchasePriceCents: 5000,
      capacity: 5,
      priceBonusCents: 10,
      repairCostCents: 500,
      initialBreakChance: 0.002,
      iconKey: "magic-carpet",
    });
  });

  it("returns cable_car with correct values", () => {
    const model = getLiftModel("cable_car");
    expect(model).toEqual({
      key: "cable_car",
      name: "Cable Car",
      purchasePriceCents: 800000,
      capacity: 100,
      priceBonusCents: 200,
      repairCostCents: 80000,
      initialBreakChance: 0.002,
      iconKey: "cable-car",
    });
  });

  it("throws for an unknown key", () => {
    expect(() => getLiftModel("invalid_key" as LiftModelKey)).toThrow(
      'Unknown lift model key: "invalid_key"'
    );
  });
});
