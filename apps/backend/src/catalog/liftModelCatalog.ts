import type { LiftModelDTO, LiftModelKey } from "@val-tick/shared";

const LIFT_MODELS: LiftModelDTO[] = [
  {
    key: "magic_carpet",
    name: "Magic Carpet",
    purchasePriceCents: 1000,
    capacity: 5,
    priceBonusCents: 10,
    repairCostCents: 100,
    initialBreakChance: 0.001,
    iconKey: "magic-carpet",
  },
  {
    key: "drag_lift",
    name: "Drag Lift",
    purchasePriceCents: 2000,
    capacity: 10,
    priceBonusCents: 20,
    repairCostCents: 200,
    initialBreakChance: 0.001,
    iconKey: "drag-lift",
  },
  {
    key: "chairlift",
    name: "Chairlift",
    purchasePriceCents: 5000,
    capacity: 20,
    priceBonusCents: 50,
    repairCostCents: 500,
    initialBreakChance: 0.001,
    iconKey: "chairlift",
  },
  {
    key: "gondola",
    name: "Gondola",
    purchasePriceCents: 20000,
    capacity: 50,
    priceBonusCents: 100,
    repairCostCents: 2000,
    initialBreakChance: 0.001,
    iconKey: "gondola",
  },
  {
    key: "cable_car",
    name: "Cable Car",
    purchasePriceCents: 50000,
    capacity: 100,
    priceBonusCents: 200,
    repairCostCents: 5000,
    initialBreakChance: 0.001,
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
