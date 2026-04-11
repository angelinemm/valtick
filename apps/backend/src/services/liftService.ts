import type { Resort, Lift } from "@prisma/client";
import type { LiftModelKey } from "@val-tick/shared";
import { getLiftModel } from "../catalog/liftModelCatalog";
import { updateResort, findResortByGuestId } from "../db/resortRepository";
import { createLift, updateLift, deleteAllLiftsForResort } from "../db/liftRepository";

export async function buyLift(
  resort: Resort & { lifts: Lift[] },
  liftModelKey: LiftModelKey
): Promise<Resort & { lifts: Lift[] }> {
  const model = getLiftModel(liftModelKey);

  if (resort.moneyCents < model.purchasePriceCents) {
    return resort;
  }

  await updateResort(resort.id, {
    moneyCents: resort.moneyCents - model.purchasePriceCents,
    lastTickAt: resort.lastTickAt,
  });

  await createLift({
    resortId: resort.id,
    liftModelKey,
    status: "working",
    currentBreakProbability: model.initialBreakChance,
  });

  return (await findResortByGuestId(resort.guestId))!;
}

export async function resetResort(
  resort: Resort & { lifts: Lift[] }
): Promise<Resort & { lifts: Lift[] }> {
  await deleteAllLiftsForResort(resort.id);
  await updateResort(resort.id, { moneyCents: 1000, lastTickAt: new Date() });
  await createLift({
    resortId: resort.id,
    liftModelKey: "magic_carpet",
    status: "working",
    currentBreakProbability: 0.001,
  });
  return (await findResortByGuestId(resort.guestId))!;
}

export async function repairLift(
  resort: Resort & { lifts: Lift[] },
  liftId: string
): Promise<Resort & { lifts: Lift[] }> {
  const lift = resort.lifts.find((l) => l.id === liftId);

  if (!lift || lift.status !== "broken") {
    return resort;
  }

  const model = getLiftModel(lift.liftModelKey as LiftModelKey);

  if (resort.moneyCents < model.repairCostCents) {
    return resort;
  }

  await updateResort(resort.id, {
    moneyCents: resort.moneyCents - model.repairCostCents,
    lastTickAt: resort.lastTickAt,
  });

  await updateLift(liftId, { status: "working" });

  return (await findResortByGuestId(resort.guestId))!;
}
