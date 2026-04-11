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
    <div className={`${styles.card} ${isBroken ? styles.broken : ""}`}>
      <img src={liftIcons[model.iconKey]} alt={model.name} width={20} height={20} />
      <span>{model.name}</span>
      <span className={styles.status}>{model.capacity}/sec</span>
      {isBroken ? (
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
      ) : (
        <span className={styles.status}>working</span>
      )}
    </div>
  );
}
