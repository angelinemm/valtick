import { Router } from "express";
import { findResortByGuestId, updateResort } from "../db/resortRepository";
import { bulkUpdateLifts } from "../db/liftRepository";
import { formatResortResponse } from "../services/resortService";
import { processOneTick } from "../services/tickService";
import type { LiftTickState } from "../services/tickService";

export const resortRouter = Router();

resortRouter.post("/tick", async (req, res) => {
  const { guestId } = req.body as { guestId: string };

  const resort = await findResortByGuestId(guestId);
  if (!resort) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const liftStates: LiftTickState[] = resort.lifts.map((l) => ({
    id: l.id,
    liftModelKey: l.liftModelKey as LiftTickState["liftModelKey"],
    status: l.status as LiftTickState["status"],
    currentBreakProbability: l.currentBreakProbability,
  }));

  const { updatedMoneyCents, updatedLifts } = processOneTick(
    resort.moneyCents,
    liftStates
  );

  await updateResort(resort.id, {
    moneyCents: updatedMoneyCents,
    lastTickAt: new Date(),
  });
  await bulkUpdateLifts(updatedLifts);

  res.json({ ok: true });
});

resortRouter.get("/resort/:guestId", async (req, res) => {
  const { guestId } = req.params;

  const resort = await findResortByGuestId(guestId);
  if (!resort) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  res.json(formatResortResponse(resort, resort.lifts));
});
