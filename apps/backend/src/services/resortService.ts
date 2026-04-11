import type { Resort, Lift } from "@prisma/client";
import type {
  GetResortResponse,
  ResortDTO,
  LiftDTO,
  LiftStatus,
  LiftModelKey,
} from "@val-tick/shared";
import { calculateSummary } from "./summaryService";
import { getAllLiftModels } from "../catalog/liftModelCatalog";

function toResortDTO(resort: Resort): ResortDTO {
  return {
    id: resort.id,
    name: resort.name,
    guestId: resort.guestId,
    moneyCents: resort.moneyCents,
    lastTickAt: resort.lastTickAt.toISOString(),
    createdAt: resort.createdAt.toISOString(),
    updatedAt: resort.updatedAt.toISOString(),
  };
}

function toLiftDTO(lift: Lift): LiftDTO {
  return {
    id: lift.id,
    resortId: lift.resortId,
    liftModelKey: lift.liftModelKey as LiftModelKey,
    currentBreakProbability: lift.currentBreakProbability,
    status: lift.status as LiftStatus,
    createdAt: lift.createdAt.toISOString(),
    updatedAt: lift.updatedAt.toISOString(),
  };
}

export function formatResortResponse(resort: Resort, lifts: Lift[]): GetResortResponse {
  const liftDTOs = lifts.map(toLiftDTO);
  const summary = calculateSummary(resort.moneyCents, liftDTOs);

  return {
    resort: toResortDTO(resort),
    summary,
    liftModels: getAllLiftModels(),
    lifts: liftDTOs,
  };
}
