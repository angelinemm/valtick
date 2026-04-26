import type { LiftModelDTO, LiftModelKey } from "@val-tick/shared";

const LIFT_MODELS: LiftModelDTO[] = [
  {
    key: "magic_carpet",
    name: "Magic Carpet",
    purchasePriceCents: 5000,
    capacity: 5,
    priceBonusCents: 10,
    repairCostCents: 500,
    baseBreakChance: 0.002,
    maxBreakChance: 0.064,
    maxRepairableBreaks: 5,
    maxOwned: 4,
    iconKey: "magic-carpet",
  },
  {
    key: "drag_lift",
    name: "Drag Lift",
    purchasePriceCents: 15000,
    capacity: 10,
    priceBonusCents: 20,
    repairCostCents: 1500,
    baseBreakChance: 0.002,
    maxBreakChance: 0.064,
    maxRepairableBreaks: 5,
    maxOwned: 4,
    iconKey: "drag-lift",
  },
  {
    key: "chairlift",
    name: "Chairlift",
    purchasePriceCents: 50000,
    capacity: 20,
    priceBonusCents: 50,
    repairCostCents: 5000,
    baseBreakChance: 0.002,
    maxBreakChance: 0.064,
    maxRepairableBreaks: 5,
    maxOwned: 8,
    iconKey: "chairlift",
  },
  {
    key: "gondola",
    name: "Gondola",
    purchasePriceCents: 800000,
    capacity: 50,
    priceBonusCents: 100,
    repairCostCents: 80000,
    baseBreakChance: 0.002,
    maxBreakChance: 0.064,
    maxRepairableBreaks: 5,
    maxOwned: 6,
    iconKey: "gondola",
  },
  {
    key: "cable_car",
    name: "Cable Car",
    purchasePriceCents: 5000000,
    capacity: 100,
    priceBonusCents: 200,
    repairCostCents: 500000,
    baseBreakChance: 0.002,
    maxBreakChance: 0.064,
    maxRepairableBreaks: 5,
    maxOwned: 1,
    iconKey: "cable-car",
  },
];

export function getLiftModel(key: LiftModelKey): LiftModelDTO {
  const model = LIFT_MODELS.find((m) => m.key === key);
  if (!model) {
    throw new Error(`Unknown lift model key: "${key}"`);
  }
  return model;
}

export function getAllLiftModels(): LiftModelDTO[] {
  return [...LIFT_MODELS];
}
