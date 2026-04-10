import { Router } from "express";
import { findResortByGuestId } from "../db/resortRepository";
import { formatResortResponse } from "../services/resortService";

export const resortRouter = Router();

resortRouter.get("/resort/:guestId", async (req, res) => {
  const { guestId } = req.params;

  const resort = await findResortByGuestId(guestId);
  if (!resort) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  res.json(formatResortResponse(resort, resort.lifts));
});
