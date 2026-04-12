import { Router } from "express";
import {
  findResortByUserId,
  updateResort,
  renameResort,
  createResortForUser,
} from "../db/resortRepository";
import { bulkUpdateLifts } from "../db/liftRepository";
import { formatResortResponse } from "../services/resortService";
import { processOneTick } from "../services/tickService";
import { buyLift, repairLift, resetResort } from "../services/liftService";
import type { LiftTickState } from "../services/tickService";
import type { LiftModelKey } from "@val-tick/shared";

export const resortRouter = Router();

resortRouter.post("/tick", async (req, res) => {
  if (!req.user!.firstLoginAt) {
    res.json({ ok: true });
    return;
  }

  const resort = await findResortByUserId(req.user!.id);
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

  const { updatedMoneyCents, updatedLifts } = processOneTick(resort.moneyCents, liftStates);

  await updateResort(resort.id, {
    moneyCents: updatedMoneyCents,
    lastTickAt: new Date(),
  });
  await bulkUpdateLifts(updatedLifts);

  res.json({ ok: true });
});

resortRouter.post("/buy_lift", async (req, res) => {
  const { liftModelKey } = req.body as { liftModelKey: LiftModelKey };

  const resort = await findResortByUserId(req.user!.id);
  if (!resort) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const updated = await buyLift(resort, liftModelKey);
  res.json(formatResortResponse(updated, updated.lifts));
});

resortRouter.post("/repair_lift", async (req, res) => {
  const { liftId } = req.body as { liftId: string };

  const resort = await findResortByUserId(req.user!.id);
  if (!resort) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const updated = await repairLift(resort, liftId);
  res.json(formatResortResponse(updated, updated.lifts));
});

resortRouter.post("/reset", async (req, res) => {
  const resort = await findResortByUserId(req.user!.id);
  if (!resort) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const updated = await resetResort(resort);
  res.json(formatResortResponse(updated, updated.lifts));
});

resortRouter.patch("/rename", async (req, res) => {
  const { name } = req.body as { name: string };

  if (!name || name.trim().length === 0) {
    res.status(400).json({ error: "Name cannot be empty" });
    return;
  }
  if (name.length > 30) {
    res.status(400).json({ error: "Name cannot exceed 30 characters" });
    return;
  }

  const resort = await findResortByUserId(req.user!.id);
  if (!resort) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const updated = await renameResort(resort.id, name.trim());
  res.json({ name: updated.name });
});

resortRouter.get("/resort", async (req, res) => {
  const user = req.user!;
  const resort =
    (await findResortByUserId(user.id)) ?? (await createResortForUser(user.id, user.username));

  res.json(formatResortResponse(resort, resort.lifts));
});
