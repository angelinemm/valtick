import type { LiftDTO, LiftModelDTO } from "@val-tick/shared";
import { liftIcons } from "../assets/liftIcons";
import styles from "./LiftRow.module.css";

interface Props {
  liftModels: LiftModelDTO[];
  junkedLifts: LiftDTO[];
}

export function JunkyardSection({ liftModels, junkedLifts }: Props) {
  if (junkedLifts.length === 0) return null;

  const groupedByModel = liftModels
    .map((model) => ({
      model,
      lifts: junkedLifts.filter((l) => l.liftModelKey === model.key),
    }))
    .filter(({ lifts }) => lifts.length > 0);

  return (
    <section>
      <h2>Junkyard</h2>
      <p>{junkedLifts.length} lifts junked</p>
      {groupedByModel.map(({ model, lifts }) => (
        <div key={model.key}>
          <strong>{model.name}</strong>
          {lifts.map((lift) => (
            <div key={lift.id} className={`${styles.card} ${styles.junked}`}>
              <img src={liftIcons[model.iconKey]} alt={model.name} width={20} height={20} />
              <span>{model.name}</span>
              <span className={styles.junkedLabel}>JUNKED</span>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
