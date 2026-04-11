import { findIdleResorts, findResortByGuestId, updateResort } from "../db/resortRepository";
import { bulkUpdateLifts } from "../db/liftRepository";
import { simulateOfflineTicks } from "../services/offlineSimService";
import type { LiftTickState } from "../services/tickService";

const IDLE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function runBackgroundSim(): Promise<void> {
  const now = new Date();
  const idleThreshold = new Date(now.getTime() - IDLE_THRESHOLD_MS);

  const idleResorts = await findIdleResorts(idleThreshold);
  console.log(`[backgroundSim] Processing ${idleResorts.length} resorts`);

  for (const idleResort of idleResorts) {
    try {
      const resort = await findResortByGuestId(idleResort.guestId);
      if (!resort) continue;

      const liftStates: LiftTickState[] = resort.lifts.map((l) => ({
        id: l.id,
        liftModelKey: l.liftModelKey as LiftTickState["liftModelKey"],
        status: l.status as LiftTickState["status"],
        currentBreakProbability: l.currentBreakProbability,
      }));

      const { updatedMoneyCents, updatedLifts, ticksSimulated } = simulateOfflineTicks({
        moneyCents: resort.moneyCents,
        lifts: liftStates,
        lastTickAt: resort.lastTickAt,
        now,
      });

      await updateResort(resort.id, {
        moneyCents: updatedMoneyCents,
        lastTickAt: now,
      });
      await bulkUpdateLifts(updatedLifts);

      console.log(`[backgroundSim] Resort ${resort.guestId}: simulated ${ticksSimulated} ticks`);
    } catch (e) {
      console.error(`[backgroundSim] Error processing resort ${idleResort.guestId}:`, e);
    }
  }
}
