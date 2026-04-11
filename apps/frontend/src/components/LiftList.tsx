import type { LiftDTO, LiftModelDTO, LiftModelKey } from "@val-tick/shared";
import { LiftGroup } from "./LiftGroup";

interface Props {
  liftModels: LiftModelDTO[];
  lifts: LiftDTO[];
  currentMoneyCents: number;
  onBuy: (liftModelKey: LiftModelKey) => void;
  onRepair: (liftId: string) => void;
}

export function LiftList({ liftModels, lifts, currentMoneyCents, onBuy, onRepair }: Props) {
  return (
    <div>
      {liftModels.map((model) => {
        const modelLifts = lifts.filter((l) => l.liftModelKey === model.key);
        return (
          <LiftGroup
            key={model.key}
            model={model}
            lifts={modelLifts}
            onBuy={() => onBuy(model.key)}
            onRepair={onRepair}
            canAffordBuy={currentMoneyCents >= model.purchasePriceCents}
            canAffordRepair={(repairCost) => currentMoneyCents >= repairCost}
          />
        );
      })}
    </div>
  );
}
