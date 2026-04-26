import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { JunkyardSection } from "../components/JunkyardSection";
import type { LiftDTO, LiftModelDTO } from "@val-tick/shared";

const liftModels: LiftModelDTO[] = [
  {
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
  },
  {
    key: "chairlift",
    name: "Chairlift",
    purchasePriceCents: 5000,
    capacity: 20,
    priceBonusCents: 50,
    repairCostCents: 500,
    baseBreakChance: 0.001,
    maxBreakChance: 0.064,
    maxRepairableBreaks: 5,
    maxOwned: 6,
    iconKey: "chairlift",
  },
];

function makeJunked(
  id: string,
  modelKey: "magic_carpet" | "chairlift",
  name = "Old Powder Keg"
): LiftDTO {
  return {
    id,
    resortId: "r1",
    liftModelKey: modelKey,
    name,
    breakCount: 5,
    status: "junked",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
}

describe("JunkyardSection", () => {
  it("returns null when junkedLifts is empty", () => {
    const { container } = render(<JunkyardSection liftModels={liftModels} junkedLifts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders Junkyard heading when lifts exist", () => {
    render(
      <JunkyardSection liftModels={liftModels} junkedLifts={[makeJunked("l1", "magic_carpet")]} />
    );
    expect(screen.getByRole("heading", { name: "Junkyard" })).toBeInTheDocument();
  });

  it("shows correct total count text", () => {
    render(
      <JunkyardSection
        liftModels={liftModels}
        junkedLifts={[makeJunked("l1", "magic_carpet"), makeJunked("l2", "magic_carpet")]}
      />
    );
    expect(screen.getByText("2 lifts junked")).toBeInTheDocument();
  });

  it("shows JUNKED label on each row", () => {
    render(
      <JunkyardSection
        liftModels={liftModels}
        junkedLifts={[makeJunked("l1", "magic_carpet"), makeJunked("l2", "chairlift")]}
      />
    );
    const labels = screen.getAllByText("JUNKED");
    expect(labels).toHaveLength(2);
  });

  it("renders no buttons", () => {
    render(
      <JunkyardSection liftModels={liftModels} junkedLifts={[makeJunked("l1", "magic_carpet")]} />
    );
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("groups lifts by model correctly", () => {
    render(
      <JunkyardSection
        liftModels={liftModels}
        junkedLifts={[makeJunked("l1", "magic_carpet"), makeJunked("l2", "chairlift")]}
      />
    );
    // Group headers still use the model name
    expect(screen.getByText("Magic Carpet")).toBeInTheDocument();
    expect(screen.getByText("Chairlift")).toBeInTheDocument();
  });

  it("renders each lift's name in its card", () => {
    render(
      <JunkyardSection
        liftModels={liftModels}
        junkedLifts={[
          makeJunked("l1", "magic_carpet", "Powder Keg"),
          makeJunked("l2", "chairlift", "Glacier Gallop"),
        ]}
      />
    );
    expect(screen.getByText("Powder Keg")).toBeInTheDocument();
    expect(screen.getByText("Glacier Gallop")).toBeInTheDocument();
  });
});
