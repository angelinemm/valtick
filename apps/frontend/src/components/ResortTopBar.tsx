import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  onRename: (name: string) => void;
  onLogout: () => void;
}

export function ResortTopBar({
  resort,
  summary,
  tickCount,
  username,
  isAdmin,
  onReset,
  onRename,
  onLogout,
}: Props) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(resort.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function startEdit() {
    setDraft(resort.name);
    setEditing(true);
  }

  function confirm() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== resort.name) {
      onRename(trimmed);
    }
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
    setDraft(resort.name);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") confirm();
    if (e.key === "Escape") cancel();
  }

  function handleReset() {
    if (window.confirm("Are you sure you want to reset your resort? This cannot be undone.")) {
      onReset();
    }
  }

  const totalSkiersDisplay = summary.totalSkiersEver.toLocaleString("en-US");

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
        {editing ? (
          <input
            ref={inputRef}
            className={styles.renameInput}
            value={draft}
            maxLength={30}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={confirm}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span className={styles.resortNameGroup} onClick={startEdit}>
            <span className={styles.resortName}>{resort.name}</span>
            <span className={styles.pencil} aria-label="Rename resort">
              ✎
            </span>
          </span>
        )}
        <span className={styles.username}>{username}</span>
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
          <span className={styles.statLabel}>Total skiers</span>
          <span className={styles.statValue}>{totalSkiersDisplay}</span>
        </div>
        <div className={styles.statBlock}>
          <span className={styles.statLabel}>Broken</span>
          {summary.brokenLiftsCount > 0 ? (
            <span
              key={`broken-${tickCount}`}
              className={`${styles.brokenValueAlert} ${styles.brokenPulse}`}
            >
              {summary.brokenLiftsCount}
            </span>
          ) : (
            <span className={styles.brokenValue}>{summary.brokenLiftsCount}</span>
          )}
        </div>
        <button className={styles.navLink} onClick={() => navigate("/how-to-play")}>
          How to Play
        </button>
        <button className={styles.navLink} onClick={() => navigate("/profile")}>
          Profile
        </button>
        {isAdmin && (
          <button className={styles.navLink} onClick={() => navigate("/admin")}>
            Admin
          </button>
        )}
        <span className={styles.divider} aria-hidden="true" />
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
