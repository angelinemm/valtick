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
  baseBreakChance: 0.001,
  maxBreakChance: 0.064,
  maxRepairableBreaks: 5,
  maxOwned: 10,
  iconKey: "magic-carpet",
};

function makeLift(id: string, status: "working" | "broken", breakCount = 0): LiftDTO {
  return {
    id,
    resortId: "r1",
    liftModelKey: "magic_carpet",
    name: `Lift ${id}`,
    breakCount,
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

  it("pulses the category name when any lift in the group is broken", () => {
    renderGroup([makeLift("l1", "broken")]);
    const heading = screen.getByText("Magic Carpet");
    expect(heading.className).toContain("alertName");
    expect(heading.className).toContain("brokenPulse");
  });

  it("does not pulse the category name when no lifts are broken", () => {
    renderGroup([makeLift("l1", "working")]);
    const heading = screen.getByText("Magic Carpet");
    expect(heading.className).toBe("");
  });

  it("shows correct owned count", () => {
    renderGroup([makeLift("l1", "working"), makeLift("l2", "working")]);
    expect(screen.getByText(/2\/10 owned/)).toBeInTheDocument();
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

  it("lift rows show wear percentage and repairs used", () => {
    renderGroup([makeLift("l1", "working", 2)]);
    expect(screen.getByText("Wear: 40% · 2/5 repairs used")).toBeInTheDocument();
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

  it("lifts stay in creation order even when some are broken", () => {
    renderGroup([makeLift("l1", "working"), makeLift("l2", "broken")]);
    const cardDivs = Array.from(document.querySelectorAll("details > div > div"));
    expect(cardDivs[0]?.textContent).toContain("Lift l1");
    expect(cardDivs[1]?.textContent).toContain("Lift l2");
  });
});
