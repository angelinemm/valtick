import type { LiftModelDTO, LiftModelKey } from "@val-tick/shared";
import { formatMoney } from "../utils/format";
import styles from "./NextLiftProgress.module.css";

interface Props {
  liftModels: LiftModelDTO[];
  currentMoneyCents: number;
  ownedModelKeys: Set<LiftModelKey>;
}

export function NextLiftProgress({ liftModels, currentMoneyCents, ownedModelKeys }: Props) {
  const nextModel = liftModels.find((m) => !ownedModelKeys.has(m.key));

  if (!nextModel) {
    return (
      <div className={styles.container}>
        <span className={styles.allAffordable}>You own every lift model — nice work.</span>
      </div>
    );
  }

  const pct = Math.min((currentMoneyCents / nextModel.purchasePriceCents) * 100, 100);

  return (
    <div className={styles.container}>
      <div className={styles.label}>
        Next: <strong>{nextModel.name}</strong> —{" "}
        <span className={styles.mono}>{formatMoney(currentMoneyCents)}</span>
        {" / "}
        <span className={styles.mono}>{formatMoney(nextModel.purchasePriceCents)}</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
