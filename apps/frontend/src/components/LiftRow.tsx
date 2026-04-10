import type { LiftDTO, LiftModelDTO } from "@val-tick/shared";
import { formatMoney } from "../utils/format";

interface Props {
  lift: LiftDTO;
  model: LiftModelDTO;
  onRepair: (liftId: string) => void;
  canAffordRepair: boolean;
}

export function LiftRow({ lift, model, onRepair, canAffordRepair }: Props) {
  const isBroken = lift.status === "broken";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.25rem 0" }}>
      <span>[{model.iconKey}]</span>
      <span>{model.name}</span>
      <span>{model.capacity}/sec</span>
      {isBroken && (
        <>
          <span style={{ color: "red", fontWeight: "bold" }}>BROKEN</span>
          <button
            onClick={() => onRepair(lift.id)}
            disabled={!canAffordRepair}
          >
            Repair ({formatMoney(model.repairCostCents)})
          </button>
        </>
      )}
    </div>
  );
}
