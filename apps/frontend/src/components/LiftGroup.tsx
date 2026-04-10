import type { LiftDTO, LiftModelDTO } from "@val-tick/shared";
import { formatMoney } from "../utils/format";
import { LiftRow } from "./LiftRow";

interface Props {
  model: LiftModelDTO;
  lifts: LiftDTO[];
  onBuy: () => void;
  onRepair: (liftId: string) => void;
  canAffordBuy: boolean;
  canAffordRepair: (repairCostCents: number) => boolean;
}

export function LiftGroup({
  model,
  lifts,
  onBuy,
  onRepair,
  canAffordBuy,
  canAffordRepair,
}: Props) {
  const brokenCount = lifts.filter((l) => l.status === "broken").length;
  const sortedLifts = [...lifts].sort((a, b) => {
    if (a.status === "broken" && b.status !== "broken") return -1;
    if (a.status !== "broken" && b.status === "broken") return 1;
    return 0;
  });

  return (
    <details open>
      <summary style={{ cursor: "pointer", padding: "0.5rem 0" }}>
        <strong>{model.name}</strong>
        {" — "}
        {lifts.length} owned, {brokenCount} broken
        {" | "}
        {formatMoney(model.purchasePriceCents)} to buy
        {" | "}
        {model.capacity}/sec capacity
        {" | "}
        +{formatMoney(model.priceBonusCents)}/sec bonus
        {" | "}
        {formatMoney(model.repairCostCents)} to repair
        {" "}
        <button onClick={onBuy} disabled={!canAffordBuy}>
          Buy ({formatMoney(model.purchasePriceCents)})
        </button>
      </summary>
      <div style={{ paddingLeft: "1rem" }}>
        {sortedLifts.map((lift) => (
          <LiftRow
            key={lift.id}
            lift={lift}
            model={model}
            onRepair={onRepair}
            canAffordRepair={canAffordRepair(model.repairCostCents)}
          />
        ))}
      </div>
    </details>
  );
}
