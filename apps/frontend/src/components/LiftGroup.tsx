import type { LiftDTO, LiftModelDTO } from "@val-tick/shared";
import { formatMoney } from "../utils/format";
import { LiftRow } from "./LiftRow";
import styles from "./LiftGroup.module.css";

interface Props {
  model: LiftModelDTO;
  lifts: LiftDTO[];
  onBuy: () => void;
  onRepair: (liftId: string) => void;
  canAffordBuy: boolean;
  canAffordRepair: (repairCostCents: number) => boolean;
}

export function LiftGroup({ model, lifts, onBuy, onRepair, canAffordBuy, canAffordRepair }: Props) {
  const ownedCount = lifts.filter((l) => l.status === "working" || l.status === "broken").length;
  const brokenCount = lifts.filter((l) => l.status === "broken").length;
  const atCap = ownedCount >= model.maxOwned;

  return (
    <details open>
      <summary className={styles.summary}>
        <strong className={brokenCount > 0 ? `${styles.alertName} ${styles.brokenPulse}` : ""}>
          {model.name}
        </strong>
        {" — "}
        {ownedCount}/{model.maxOwned} owned, {brokenCount} broken
        {" | "}
        {formatMoney(model.purchasePriceCents)} to buy
        {" | "}
        {model.capacity}/sec capacity
        {" | "}+{formatMoney(model.priceBonusCents)}/sec bonus
        {" | "}
        {formatMoney(model.repairCostCents)} to repair{" "}
        <button
          onClick={onBuy}
          disabled={!canAffordBuy || atCap}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {atCap ? "Max reached" : `Buy (${formatMoney(model.purchasePriceCents)})`}
        </button>
      </summary>
      <div style={{ paddingLeft: "0.5rem" }}>
        {lifts.map((lift) => (
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
