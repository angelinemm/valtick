import type { LiftModelDTO, LiftDTO, ResortDTO, SummaryDTO } from "./models";
import type { LiftModelKey } from "./enums";

export interface GetResortResponse {
  resort: ResortDTO;
  summary: SummaryDTO;
  liftModels: LiftModelDTO[];
  lifts: LiftDTO[];
}

export type MutationResortResponse = GetResortResponse;

export interface TickResponse {
  ok: boolean;
}

export interface TickRequest {
  guestId: string;
}

export interface BuyLiftRequest {
  guestId: string;
  liftModelKey: LiftModelKey;
}

export interface RepairLiftRequest {
  guestId: string;
  liftId: string;
}

export interface ResetResortRequest {
  guestId: string;
}

export type ResetResortResponse = GetResortResponse;
