import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTick } from "../hooks/useTick";

// vi.mock is hoisted — use vi.hoisted so the spy variable is available inside the factory
const mutateSpy = vi.hoisted(() => vi.fn());

vi.mock("../hooks/useTickMutation", () => ({
  useTickMutation: () => ({ mutate: mutateSpy }),
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { queryClient, wrapper: Wrapper };
}

function hideTab() {
  Object.defineProperty(document, "visibilityState", {
    get: () => "hidden",
    configurable: true,
  });
  act(() => document.dispatchEvent(new Event("visibilitychange")));
}

function showTab() {
  Object.defineProperty(document, "visibilityState", {
    get: () => "visible",
    configurable: true,
  });
  act(() => document.dispatchEvent(new Event("visibilitychange")));
}

beforeEach(() => {
  vi.useFakeTimers();
  mutateSpy.mockClear();
  Object.defineProperty(document, "visibilityState", {
    get: () => "visible",
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useTick", () => {
  it("tick mutation called after 1000ms when tab active", () => {
    const { wrapper } = makeWrapper();
    renderHook(() => useTick("abc"), { wrapper });
    vi.advanceTimersByTime(1000);
    expect(mutateSpy).toHaveBeenCalledOnce();
  });

  it("tick mutation NOT called at 1000ms when tab hidden", () => {
    const { wrapper } = makeWrapper();
    renderHook(() => useTick("abc"), { wrapper });
    hideTab();
    vi.advanceTimersByTime(1000);
    expect(mutateSpy).not.toHaveBeenCalled();
  });

  it("tick mutation called at 10000ms when tab hidden", () => {
    const { wrapper } = makeWrapper();
    renderHook(() => useTick("abc"), { wrapper });
    hideTab();
    vi.advanceTimersByTime(10_000);
    expect(mutateSpy).toHaveBeenCalledOnce();
  });

  it("after 5 minutes hidden, no more ticks fire", () => {
    const { wrapper } = makeWrapper();
    renderHook(() => useTick("abc"), { wrapper });
    hideTab();
    // Advance to 5 min — the tick at exactly 300s sees hiddenFor>=5min and stops
    vi.advanceTimersByTime(5 * 60 * 1_000);
    const callsAtStop = mutateSpy.mock.calls.length;
    // Advance further — interval is gone, no new calls
    vi.advanceTimersByTime(30_000);
    expect(mutateSpy.mock.calls.length).toBe(callsAtStop);
  });

  it("return from 5+ min: tick resumes AND resort query is invalidated", () => {
    const { queryClient, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderHook(() => useTick("abc123"), { wrapper });
    hideTab();
    vi.advanceTimersByTime(5 * 60 * 1_000 + 1_000);
    showTab();

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["resort", "abc123"],
    });

    mutateSpy.mockClear();
    vi.advanceTimersByTime(1_000);
    expect(mutateSpy).toHaveBeenCalledOnce();
  });

  it("return from < 5 min: tick resumes, resort query NOT invalidated", () => {
    const { queryClient, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderHook(() => useTick("abc"), { wrapper });
    hideTab();
    vi.advanceTimersByTime(60 * 1_000); // 1 minute
    showTab();

    expect(invalidateSpy).not.toHaveBeenCalled();

    mutateSpy.mockClear();
    vi.advanceTimersByTime(1_000);
    expect(mutateSpy).toHaveBeenCalledOnce();
  });

  it("on unmount, interval is cleared, no more ticks fire", () => {
    const { wrapper } = makeWrapper();
    const { unmount } = renderHook(() => useTick("abc"), { wrapper });

    vi.advanceTimersByTime(1_000);
    expect(mutateSpy).toHaveBeenCalledOnce();

    mutateSpy.mockClear();
    unmount();

    vi.advanceTimersByTime(3_000);
    expect(mutateSpy).not.toHaveBeenCalled();
  });
});
