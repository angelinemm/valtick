import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResortTopBar } from "../components/ResortTopBar";
import type { ResortDTO, SummaryDTO } from "@val-tick/shared";

const resort: ResortDTO = {
  id: "r1",
  name: "Snowpeak",
  guestId: "guest99",
  moneyCents: 1000,
  lastTickAt: "2024-01-01T00:00:00.000Z",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const summary: SummaryDTO = {
  moneyCents: 1000,
  incomePerSecCents: 550,
  capacityPerSec: 25,
  passPriceCents: 100,
  totalLifts: 4,
  brokenLiftsCount: 1,
  junkedLiftsCount: 0,
};

function renderBar(onReset = vi.fn()) {
  render(<ResortTopBar resort={resort} summary={summary} tickCount={0} onReset={onReset} />);
}

describe("ResortTopBar", () => {
  it("renders resort name", () => {
    renderBar();
    expect(screen.getByText("Snowpeak")).toBeInTheDocument();
  });

  it("renders guest ID", () => {
    renderBar();
    expect(screen.getByText("(guest99)")).toBeInTheDocument();
  });

  it("renders money as $10.00 when moneyCents=1000", () => {
    renderBar();
    expect(screen.getByText("$10.00")).toBeInTheDocument();
  });

  it("renders income as $5.50/sec when incomePerSecCents=550", () => {
    renderBar();
    expect(screen.getByText("$5.50/sec")).toBeInTheDocument();
  });

  it("renders capacity as 25 when capacityPerSec=25", () => {
    renderBar();
    expect(screen.getByText("25/sec")).toBeInTheDocument();
  });

  it("renders totalLifts as 4", () => {
    renderBar();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("renders brokenLiftsCount as 1", () => {
    renderBar();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders brokenLiftsCount of 0 when there are no broken lifts", () => {
    render(
      <ResortTopBar
        resort={resort}
        summary={{ ...summary, brokenLiftsCount: 0 }}
        tickCount={0}
        onReset={vi.fn()}
      />
    );
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders a Reset button", () => {
    renderBar();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("calls onReset after user confirms", async () => {
    const onReset = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderBar(onReset);
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("does NOT call onReset if user cancels confirm", async () => {
    const onReset = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderBar(onReset);
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onReset).not.toHaveBeenCalled();
  });
});
