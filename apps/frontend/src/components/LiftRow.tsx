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
  const wearPercent = Math.round((lift.breakCount / model.maxRepairableBreaks) * 100);

  return (
    <div className={`${styles.card} ${styles[lift.status]}`}>
      <img src={liftIcons[model.iconKey]} alt={model.name} width={20} height={20} />
      <div className={styles.nameBlock}>
        <span className={styles.liftName}>{lift.name}</span>
        <span className={styles.wearText}>
          Wear: {wearPercent}% · {lift.breakCount}/{model.maxRepairableBreaks} repairs used
        </span>
      </div>
      <div className={styles.actions}>
        {isBroken ? (
          <>
            <span className={`${styles.brokenLabel} ${styles.brokenPulse}`}>BROKEN</span>
            <button
              className={styles.repairButton}
              onClick={() => onRepair(lift.id)}
              disabled={!canAffordRepair}
            >
              Repair ({formatMoney(model.repairCostCents)})
            </button>
          </>
        ) : (
          <span className={styles.workingLabel}>working</span>
        )}
      </div>
    </div>
  );
}
