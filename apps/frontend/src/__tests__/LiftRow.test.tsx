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

function makeLift(status: "working" | "broken"): LiftDTO {
  return {
    id: "l1",
    resortId: "r1",
    liftModelKey: "magic_carpet",
    name: "Powder Keg",
    breakCount: 0,
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

  it("renders the model name in parentheses below the lift name", () => {
    render(
      <LiftRow lift={makeLift("working")} model={model} onRepair={vi.fn()} canAffordRepair={true} />
    );
    expect(screen.getByText("(Magic Carpet)")).toBeInTheDocument();
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
