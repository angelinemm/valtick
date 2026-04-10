import type { LiftModelKey, LiftStatus, SummaryDTO } from "@val-tick/shared";
import { getLiftModel } from "../catalog/liftModelCatalog";

type LiftSummaryInput = {
  status: LiftStatus;
  liftModelKey: LiftModelKey;
};

const BASE_PASS_PRICE_CENTS = 100;

export function calculateSummary(
  moneyCents: number,
  lifts: LiftSummaryInput[]
): SummaryDTO {
  const workingLifts = lifts.filter((l) => l.status === "working");

  const capacityPerSec = workingLifts.reduce((sum, l) => {
    return sum + getLiftModel(l.liftModelKey).capacity;
  }, 0);

  const passPriceCents =
    BASE_PASS_PRICE_CENTS +
    workingLifts.reduce((sum, l) => {
      return sum + getLiftModel(l.liftModelKey).priceBonusCents;
    }, 0);

  const incomePerSecCents = capacityPerSec * passPriceCents;

  return {
    moneyCents,
    incomePerSecCents,
    capacityPerSec,
    passPriceCents,
    totalLifts: lifts.length,
    brokenLiftsCount: lifts.filter((l) => l.status === "broken").length,
    junkedLiftsCount: lifts.filter((l) => l.status === "junked").length,
  };
}
