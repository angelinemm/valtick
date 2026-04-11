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
  initialBreakChance: 0.001,
  iconKey: "magic-carpet",
};

function makeLift(status: "working" | "broken"): LiftDTO {
  return {
    id: "l1",
    resortId: "r1",
    liftModelKey: "magic_carpet",
    currentBreakProbability: 0.001,
    status,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
}

describe("LiftRow", () => {
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
