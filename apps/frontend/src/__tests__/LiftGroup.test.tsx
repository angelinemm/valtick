import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LiftGroup } from "../components/LiftGroup";
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

function makeLift(id: string, status: "working" | "broken"): LiftDTO {
  return {
    id,
    resortId: "r1",
    liftModelKey: "magic_carpet",
    currentBreakProbability: 0.001,
    status,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
}

function renderGroup(
  lifts: LiftDTO[],
  {
    canAffordBuy = true,
    canAffordRepair = true,
    onBuy = vi.fn(),
    onRepair = vi.fn(),
  }: {
    canAffordBuy?: boolean;
    canAffordRepair?: boolean;
    onBuy?: () => void;
    onRepair?: (id: string) => void;
  } = {}
) {
  render(
    <LiftGroup
      model={model}
      lifts={lifts}
      onBuy={onBuy}
      onRepair={onRepair}
      canAffordBuy={canAffordBuy}
      canAffordRepair={() => canAffordRepair}
    />
  );
}

describe("LiftGroup", () => {
  it("renders model name in header", () => {
    renderGroup([]);
    expect(screen.getByText(/Magic Carpet/)).toBeInTheDocument();
  });

  it("shows correct owned count", () => {
    renderGroup([makeLift("l1", "working"), makeLift("l2", "working")]);
    expect(screen.getByText(/2 owned/)).toBeInTheDocument();
  });

  it("shows correct broken count", () => {
    renderGroup([makeLift("l1", "working"), makeLift("l2", "broken")]);
    expect(screen.getByText(/1 broken/)).toBeInTheDocument();
  });

  it("group is expanded by default", () => {
    renderGroup([]);
    expect(document.querySelector("details")).toHaveAttribute("open");
  });

  it("buy button is disabled when canAffordBuy=false", () => {
    renderGroup([], { canAffordBuy: false });
    expect(screen.getByRole("button", { name: /Buy/ })).toBeDisabled();
  });

  it("buy button click calls onBuy", async () => {
    const onBuy = vi.fn();
    renderGroup([], { onBuy });
    await userEvent.click(screen.getByRole("button", { name: /Buy/ }));
    expect(onBuy).toHaveBeenCalledOnce();
  });

  it("broken lift row shows BROKEN text", () => {
    renderGroup([makeLift("l1", "broken")]);
    expect(screen.getByText("BROKEN")).toBeInTheDocument();
  });

  it("repair button click calls onRepair with correct liftId", async () => {
    const onRepair = vi.fn();
    renderGroup([makeLift("lift-abc", "broken")], { onRepair });
    await userEvent.click(screen.getByRole("button", { name: /Repair/ }));
    expect(onRepair).toHaveBeenCalledWith("lift-abc");
  });

  it("repair button is disabled when canAffordRepair returns false", () => {
    renderGroup([makeLift("l1", "broken")], { canAffordRepair: false });
    expect(screen.getByRole("button", { name: /Repair/ })).toBeDisabled();
  });

  it("working lift does not show BROKEN", () => {
    renderGroup([makeLift("l1", "working")]);
    expect(screen.queryByText("BROKEN")).not.toBeInTheDocument();
  });

  it("broken lifts appear before working lifts", () => {
    renderGroup([makeLift("l1", "working"), makeLift("l2", "broken")]);
    const rows = screen.getAllByText(/Magic Carpet/);
    // header + 2 rows; the broken row has a BROKEN sibling so check ordering via DOM
    const brokenLabel = screen.getByText("BROKEN");
    // verify BROKEN appears in the DOM before any row without it
    const cardDivs = Array.from(document.querySelectorAll("details > div > div"));
    const brokenIndex = cardDivs.findIndex((r) => r.textContent?.includes("BROKEN"));
    const workingIndex = cardDivs.findIndex((r) => !r.textContent?.includes("BROKEN"));
    expect(brokenIndex).toBeLessThan(workingIndex);
    expect(rows.length).toBeGreaterThan(0);
    expect(brokenLabel).toBeInTheDocument();
  });
});
