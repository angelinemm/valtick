import { useNavigate } from "react-router-dom";
import styles from "./HowToPlayPage.module.css";

export function HowToPlayPage() {
  const navigate = useNavigate();

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
          d="M0,400 L0,180 L100,90 L200,150 L330,40 L460,110 L580,20 L700,90 L820,50 L940,130 L1060,60 L1200,100 L1200,400 Z"
          fill="#16293e"
        />
        <path
          d="M0,400 L0,280 L120,230 L240,260 L360,200 L490,240 L620,210 L740,250 L860,220 L980,255 L1100,235 L1200,245 L1200,400 Z"
          fill="#0c1a25"
        />
      </svg>

      <div className={styles.panel}>
        <div className={styles.toolbar}>
          <button onClick={() => navigate("/")}>← Back to game</button>
        </div>

        <h1 className={styles.title}>How to Play</h1>

        <section className={styles.section}>
          <h2 className={styles.heading}>The goal</h2>
          <p>
            You're running a ski resort. Build lifts, keep them running, and watch the money roll
            in. The more lifts you have — and the fancier they are — the more skiers show up and the
            more you earn. There's no finish line; just keep growing.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>How you earn money</h2>
          <p>
            Every working lift carries skiers up the mountain, and every skier buys a pass. Your
            income per second depends on two things: how many skiers your lifts can carry, and how
            much a pass costs.
          </p>
          <p>
            Pass price goes up as you add bigger lifts — a resort with a cable car charges more than
            one with only magic carpets. So upgrading isn't just about capacity; it also makes every
            existing lift more valuable.
          </p>
          <p>Broken or junked lifts contribute nothing to your income.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>The lifts</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Lift</th>
                <th>Cost</th>
                <th>Max owned</th>
                <th>Repair cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Magic Carpet</td>
                <td>$50</td>
                <td>10</td>
                <td>$5</td>
              </tr>
              <tr>
                <td>Drag Lift</td>
                <td>$150</td>
                <td>8</td>
                <td>$15</td>
              </tr>
              <tr>
                <td>Chairlift</td>
                <td>$500</td>
                <td>6</td>
                <td>$50</td>
              </tr>
              <tr>
                <td>Gondola</td>
                <td>$8,000</td>
                <td>4</td>
                <td>$800</td>
              </tr>
              <tr>
                <td>Cable Car</td>
                <td>$50,000</td>
                <td>1</td>
                <td>$5,000</td>
              </tr>
            </tbody>
          </table>
          <p className={styles.note}>
            You can't stack unlimited copies of any lift — bigger lifts have tighter caps. You can
            only ever own one Cable Car.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Breakdowns</h2>
          <p>
            Lifts break down over time. When a lift breaks, it stops earning and sits there costing
            you nothing — until you pay to repair it. Repairs are cheap early on but get expensive
            for high-end lifts.
          </p>
          <p>
            Each time a lift breaks, its future break chance doubles. A lift that has broken many
            times will break again very quickly. If the break chance reaches the maximum, the lift
            is <strong>junked</strong> — it's gone for good and can't be repaired.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Repairing a lift</h2>
          <p>
            Broken lifts show up highlighted in the lift list. Click <strong>Repair</strong> on any
            broken lift to pay the repair cost and put it back in service immediately. You need
            enough money in the bank — if you can't afford it, the button is disabled.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Junked lifts</h2>
          <p>
            Junked lifts have broken their last time. They move to the Junkyard section at the
            bottom of the page. They're purely cosmetic — no income, no repair option, no coming
            back. You'll need to buy a replacement if you want that capacity back.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>The failure state</h2>
          <p>
            If all your lifts break or get junked and you don't have enough money to repair any of
            them, income drops to zero and you're stuck. You can hit <strong>Reset</strong> in the
            top bar to start fresh — but that wipes everything. Avoid getting here.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Tips</h2>
          <ul className={styles.tips}>
            <li>
              <strong>Don't let breaks pile up.</strong> One broken lift is a small dip in income.
              Five broken lifts can spiral into a death loop where you can't earn fast enough to
              repair them.
            </li>
            <li>
              <strong>Keep a repair buffer.</strong> Before buying a big lift, make sure you'd still
              be able to repair your existing ones if they break immediately after.
            </li>
            <li>
              <strong>Diversify early.</strong> A spread of cheap lifts is more resilient than a
              single expensive one — if one breaks, the others keep the money coming in.
            </li>
          </ul>
        </section>

        <div className={styles.backRow}>
          <button onClick={() => navigate("/")}>← Back to game</button>
        </div>
      </div>
    </div>
  );
}
