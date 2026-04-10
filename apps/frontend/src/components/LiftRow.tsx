import type { LiftDTO, LiftModelDTO } from "@val-tick/shared";
import { formatMoney } from "../utils/format";
import { liftIcons } from "../assets/liftIcons";
import styles from "./LiftRow.module.css";

interface Props {
  lift: LiftDTO;
  model: LiftModelDTO;
  onRepair: (liftId: string) => void;
  canAffordRepair: boolean;
}

export function LiftRow({ lift, model, onRepair, canAffordRepair }: Props) {
  const isBroken = lift.status === "broken";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.25rem 0" }}>
      <img src={liftIcons[model.iconKey]} alt={model.name} width={24} height={24} />
      <span>{model.name}</span>
      <span>{model.capacity}/sec</span>
      {isBroken && (
        <>
          <span className={styles.brokenLabel}>BROKEN</span>
          <button
            className={styles.repairButton}
            onClick={() => onRepair(lift.id)}
            disabled={!canAffordRepair}
          >
            Repair ({formatMoney(model.repairCostCents)})
          </button>
        </>
      )}
    </div>
  );
}
