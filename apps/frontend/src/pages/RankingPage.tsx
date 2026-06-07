import { useNavigate } from "react-router-dom";
import { useResortRanking } from "../hooks/useResortRanking";
import styles from "./RankingPage.module.css";

function medalClass(rank: number) {
  if (rank === 1) return styles.goldMedal;
  if (rank === 2) return styles.silverMedal;
  if (rank === 3) return styles.bronzeMedal;
  return "";
}

function medalLabel(rank: number) {
  if (rank === 1) return "Gold medal";
  if (rank === 2) return "Silver medal";
  if (rank === 3) return "Bronze medal";
  return "";
}

export function RankingPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useResortRanking();
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  return (
    <div className={styles.page}>
      <svg
        className={styles.mountains}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 400"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <path
          d="M0,400 L0,190 L100,120 L215,160 L330,65 L455,130 L580,40 L705,100 L820,70 L940,145 L1060,80 L1200,125 L1200,400 Z"
          fill="#16293e"
        />
        <path
          d="M0,400 L0,292 L120,245 L250,268 L370,215 L500,250 L625,225 L750,262 L875,232 L1000,260 L1120,240 L1200,255 L1200,400 Z"
          fill="#0c1a25"
        />
      </svg>

      <main className={styles.panel}>
        <div className={styles.toolbar}>
          <button onClick={() => navigate("/")}>Back to game</button>
        </div>

        <header className={styles.header}>
          <h1 className={styles.title}>Resort Ranking</h1>
          <p className={styles.subtitle}>Ranked by total skiers ever.</p>
        </header>

        {isLoading && <div className={styles.state}>Loading...</div>}
        {error && <div className={styles.state}>Something went wrong: {errorMessage}</div>}

        {data && (
          <div className={styles.rankingList} aria-label="Resort ranking">
            <div className={`${styles.row} ${styles.headingRow}`}>
              <span>Rank</span>
              <span>Resort</span>
              <span>Skiers</span>
            </div>

            {data.rankings.map((entry) => {
              const hasMedal = entry.rank <= 3;
              return (
                <div
                  key={entry.resortId}
                  className={`${styles.row} ${entry.isCurrentUser ? styles.currentUserRow : ""}`}
                >
                  <span className={styles.rank}>#{entry.rank}</span>
                  <span className={styles.nameCell}>
                    {hasMedal && (
                      <span
                        className={`${styles.medal} ${medalClass(entry.rank)}`}
                        aria-label={medalLabel(entry.rank)}
                        title={medalLabel(entry.rank)}
                      >
                        {entry.rank}
                      </span>
                    )}
                    <span className={styles.resortName}>{entry.name}</span>
                    {!entry.isCurrentUser && (
                      <span className={styles.username}>({entry.username})</span>
                    )}
                    {entry.isCurrentUser && <span className={styles.youBadge}>You</span>}
                  </span>
                  <span className={styles.skiers}>
                    {entry.totalSkiersEver.toLocaleString("en-US")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
