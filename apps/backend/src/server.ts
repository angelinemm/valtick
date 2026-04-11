import { app } from "./index";
import { runBackgroundSim } from "./jobs/backgroundSimJob";

const PORT = 3001;
const BACKGROUND_JOB_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);

  setInterval(() => {
    runBackgroundSim().catch((e) => console.error("[backgroundSim] Unhandled error:", e));
  }, BACKGROUND_JOB_INTERVAL_MS);
});
