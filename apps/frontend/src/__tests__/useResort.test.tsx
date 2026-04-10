import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useResort } from "../hooks/useResort";
import * as client from "../api/client";
import type { GetResortResponse } from "@val-tick/shared";

const mockResponse: GetResortResponse = {
  resort: {
    id: "r1",
    name: "Val Thorens",
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
    totalLifts: 1,
    brokenLiftsCount: 0,
    junkedLiftsCount: 0,
  },
  liftModels: [],
  lifts: [],
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

afterEach(() => vi.restoreAllMocks());

describe("useResort", () => {
  it("returns loading state initially", () => {
    vi.spyOn(client, "fetchResort").mockResolvedValue(mockResponse);
    const { result } = renderHook(() => useResort("abc123"), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
  });

  it("returns data on 200 success", async () => {
    vi.spyOn(client, "fetchResort").mockResolvedValue(mockResponse);
    const { result } = renderHook(() => useResort("abc123"), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
  });

  it("surfaces NOT_FOUND error on 404", async () => {
    vi.spyOn(client, "fetchResort").mockRejectedValue(new Error("NOT_FOUND"));
    const { result } = renderHook(() => useResort("nope"), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("NOT_FOUND");
  });
});
