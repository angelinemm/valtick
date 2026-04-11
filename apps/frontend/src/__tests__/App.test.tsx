import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, afterEach } from "vitest";
import App from "../App";
import { NotFoundPage } from "../pages/NotFoundPage";
import { GameNotFoundPage } from "../pages/GameNotFoundPage";
import * as client from "../api/client";
import type { GetResortResponse } from "@val-tick/shared";

const mockResortResponse: GetResortResponse = {
  resort: {
    id: "r1",
    name: "Snowpeak",
    guestId: "abc123",
    moneyCents: 1000,
    lastTickAt: "2024-01-01T00:00:00.000Z",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  summary: {
    moneyCents: 1000,
    incomePerSecCents: 100,
    capacityPerSec: 10,
    passPriceCents: 100,
    totalLifts: 0,
    brokenLiftsCount: 0,
    junkedLiftsCount: 0,
  },
  liftModels: [],
  lifts: [],
};

afterEach(() => vi.restoreAllMocks());

function renderWithRouter(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("App routing", () => {
  it("renders resort name for /resort/:guestId", async () => {
    vi.spyOn(client, "fetchResort").mockResolvedValue(mockResortResponse);
    renderWithRouter("/resort/abc123");
    await waitFor(() => expect(screen.getByText("Snowpeak")).toBeInTheDocument());
  });

  it("renders NotFoundPage for an unknown route", () => {
    renderWithRouter("/unknown-route");
    expect(screen.getByText("Game not found.")).toBeInTheDocument();
  });
});

describe("NotFoundPage", () => {
  it("renders the expected message", () => {
    render(<NotFoundPage />);
    expect(screen.getByText("Game not found.")).toBeInTheDocument();
    expect(screen.getByText("Check your URL or ask for a valid guest ID.")).toBeInTheDocument();
  });
});

describe("GameNotFoundPage", () => {
  it("renders the expected message", () => {
    render(<GameNotFoundPage />);
    expect(screen.getByText("This resort doesn't exist.")).toBeInTheDocument();
  });
});
