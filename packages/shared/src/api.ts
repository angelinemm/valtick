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

export interface BuyLiftRequest {
  liftModelKey: LiftModelKey;
}

export interface RepairLiftRequest {
  liftId: string;
}

export type ResetResortResponse = GetResortResponse;
