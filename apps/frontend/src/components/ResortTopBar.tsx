import type { ResortDTO, SummaryDTO } from "@val-tick/shared";
import { formatMoney, formatMoneyPerSec } from "../utils/format";
import styles from "./ResortTopBar.module.css";

interface Props {
  resort: ResortDTO;
  summary: SummaryDTO;
  tickCount: number;
  onReset: () => void;
}

export function ResortTopBar({ resort, summary, tickCount, onReset }: Props) {
  function handleReset() {
    if (window.confirm("Are you sure you want to reset your resort? This cannot be undone.")) {
      onReset();
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.meta}>
        <span className={styles.resortName}>{resort.name}</span>
        <span className={styles.guestId}>({resort.guestId})</span>
      </div>
      <div className={styles.statsRow}>
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Money</span>
          <span className={styles.statValue}>{formatMoney(summary.moneyCents)}</span>
        </div>
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Income/sec</span>
          <span key={tickCount} className={`${styles.incomeValue} ${styles.pulse}`}>
            {formatMoneyPerSec(summary.incomePerSecCents)}
          </span>
        </div>
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Capacity</span>
          <span className={styles.statValue}>{summary.capacityPerSec}/sec</span>
        </div>
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Lifts</span>
          <span className={styles.statValue}>{summary.totalLifts}</span>
        </div>
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Broken</span>
          <span className={styles.statValue}>{summary.brokenLiftsCount}</span>
        </div>
        <button className={styles.resetButton} onClick={handleReset}>
          Reset
        </button>
      </div>
    </header>
  );
}
