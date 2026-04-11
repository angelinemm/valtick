import { Link } from "react-router-dom";
import type { ResortDTO, SummaryDTO } from "@val-tick/shared";
import { formatMoney, formatMoneyPerSec } from "../utils/format";
import styles from "./ResortTopBar.module.css";

interface Props {
  resort: ResortDTO;
  summary: SummaryDTO;
  tickCount: number;
  username: string;
  isAdmin?: boolean;
  onReset: () => void;
  onLogout: () => void;
}

export function ResortTopBar({
  resort,
  summary,
  tickCount,
  username,
  isAdmin,
  onReset,
  onLogout,
}: Props) {
  function handleReset() {
    if (window.confirm("Are you sure you want to reset your resort? This cannot be undone.")) {
      onReset();
    }
  }

  return (
    <header className={styles.header}>
      <svg
        className={styles.mountains}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Far range — lighter, taller peaks */}
        <path
          d="M0,80 L0,55 L70,22 L140,48 L230,8 L320,35 L420,15 L520,40 L630,5 L720,32 L820,18 L920,44 L1020,12 L1120,38 L1200,28 L1200,80 Z"
          fill="#16293e"
        />
        {/* Near range — darker foreground silhouette */}
        <path
          d="M0,80 L0,68 L90,52 L180,64 L270,44 L370,60 L460,46 L560,62 L660,48 L760,65 L860,50 L960,66 L1060,54 L1160,67 L1200,58 L1200,80 Z"
          fill="#0c1a25"
        />
      </svg>
      <div className={styles.meta}>
        <span className={styles.resortName}>{resort.name}</span>
        <span className={styles.username}>{username}</span>
        {isAdmin && (
          <Link to="/admin" className={styles.adminLink}>
            Admin
          </Link>
        )}
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
        <button className={styles.resetButton} onClick={onLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}
