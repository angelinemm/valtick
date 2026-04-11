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
    <header
      style={{
        display: "flex",
        gap: "1.5rem",
        padding: "0.75rem 1rem",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <span>
        <strong>Resort:</strong> {resort.name}
      </span>
      <span>
        <strong>Guest ID:</strong> {resort.guestId}
      </span>
      <span>
        <strong>Money:</strong> {formatMoney(summary.moneyCents)}
      </span>
      <span key={tickCount} className={`${styles.income} ${styles.pulse}`}>
        <strong>Income:</strong> {formatMoneyPerSec(summary.incomePerSecCents)}
      </span>
      <span>
        <strong>Capacity:</strong> {summary.capacityPerSec}/sec
      </span>
      <span>
        <strong>Lifts:</strong> {summary.totalLifts}
      </span>
      <span>
        <strong>Broken:</strong> {summary.brokenLiftsCount}
      </span>
      <button
        className="reset-button"
        onClick={handleReset}
        style={{
          marginLeft: "auto",
          padding: "0.4rem 1rem",
          fontWeight: "bold",
        }}
      >
        Reset
      </button>
    </header>
  );
}
