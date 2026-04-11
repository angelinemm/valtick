import type { LiftModelKey, LiftStatus } from "./enums";

export interface LiftModelDTO {
  key: LiftModelKey;
  name: string;
  purchasePriceCents: number;
  capacity: number;
  priceBonusCents: number;
  repairCostCents: number;
  initialBreakChance: number;
  maxOwned: number;
  iconKey: string;
}

export interface ResortDTO {
  id: string;
  name: string;
  guestId: string | null;
  moneyCents: number;
  lastTickAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiftDTO {
  id: string;
  resortId: string;
  liftModelKey: LiftModelKey;
  currentBreakProbability: number;
  status: LiftStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SummaryDTO {
  moneyCents: number;
  incomePerSecCents: number;
  capacityPerSec: number;
  passPriceCents: number;
  totalLifts: number;
  brokenLiftsCount: number;
  junkedLiftsCount: number;
}
