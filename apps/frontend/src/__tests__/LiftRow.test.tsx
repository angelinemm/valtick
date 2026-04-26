import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiftRow } from "../components/LiftRow";
import type { LiftDTO, LiftModelDTO } from "@val-tick/shared";

const model: LiftModelDTO = {
  key: "magic_carpet",
  name: "Magic Carpet",
  purchasePriceCents: 1000,
  capacity: 5,
  priceBonusCents: 10,
  repairCostCents: 100,
  baseBreakChance: 0.001,
  maxBreakChance: 0.064,
  maxRepairableBreaks: 5,
  maxOwned: 10,
  iconKey: "magic-carpet",
};

function makeLift(status: "working" | "broken", breakCount = 0): LiftDTO {
  return {
    id: "l1",
    resortId: "r1",
    liftModelKey: "magic_carpet",
    name: "Powder Keg",
    breakCount,
    status,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
}

describe("LiftRow", () => {
  it("renders the lift name prominently", () => {
    render(
      <LiftRow lift={makeLift("working")} model={model} onRepair={vi.fn()} canAffordRepair={true} />
    );
    expect(screen.getByText("Powder Keg")).toBeInTheDocument();
  });

  it("renders wear details below the lift name", () => {
    render(
      <LiftRow
        lift={makeLift("working", 2)}
        model={model}
        onRepair={vi.fn()}
        canAffordRepair={true}
      />
    );
    expect(screen.getByText("Wear: 40% · 2/5 repairs used")).toBeInTheDocument();
  });

  it("does not render the lift model name in the row body", () => {
    render(
      <LiftRow lift={makeLift("working")} model={model} onRepair={vi.fn()} canAffordRepair={true} />
    );
    expect(screen.queryByText("(Magic Carpet)")).not.toBeInTheDocument();
    expect(screen.queryByText("5/sec")).not.toBeInTheDocument();
  });

  it("broken LiftRow has the broken CSS class on the label", () => {
    render(
      <LiftRow lift={makeLift("broken")} model={model} onRepair={vi.fn()} canAffordRepair={true} />
    );
    const label = screen.getByText("BROKEN");
    expect(label.className).toContain("brokenLabel");
  });

  it("working LiftRow does not have the broken CSS class", () => {
    render(
      <LiftRow lift={makeLift("working")} model={model} onRepair={vi.fn()} canAffordRepair={true} />
    );
    expect(screen.queryByText("BROKEN")).not.toBeInTheDocument();
  });
});
