import type { LiftModelDTO } from "@val-tick/shared";
import { formatMoney } from "../utils/format";
import styles from "./NextLiftProgress.module.css";

interface Props {
  liftModels: LiftModelDTO[];
  currentMoneyCents: number;
}

export function NextLiftProgress({ liftModels, currentMoneyCents }: Props) {
  const nextModel = liftModels.find((m) => currentMoneyCents < m.purchasePriceCents);

  if (!nextModel) {
    return (
      <div className={styles.container}>
        <span className={styles.allAffordable}>You can buy anything — nice work.</span>
      </div>
    );
  }

  const pct = Math.min((currentMoneyCents / nextModel.purchasePriceCents) * 100, 100);

  return (
    <div className={styles.container}>
      <div className={styles.label}>
        Next: <strong>{nextModel.name}</strong> — {formatMoney(currentMoneyCents)} /{" "}
        {formatMoney(nextModel.purchasePriceCents)}
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
