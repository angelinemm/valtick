import { describe, it, expect, vi, afterEach } from "vitest";
import {
  fetchResort,
  fetchResortRanking,
  postTick,
  postBuyLift,
  postRepairLift,
} from "../api/client";
import type { GetResortResponse, GetResortRankingResponse } from "@val-tick/shared";

const mockResortResponse: GetResortResponse = {
  resort: {
    id: "r1",
    name: "Val Thorens",
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
    totalSkiersEver: 25,
  },
  liftModels: [],
  lifts: [],
};

const mockRankingResponse: GetResortRankingResponse = {
  rankings: [
    {
      resortId: "r2",
      rank: 1,
      name: "Summit",
      totalSkiersEver: 500,
      isCurrentUser: false,
    },
    {
      resortId: "r1",
      rank: 2,
      name: "Val Thorens",
      totalSkiersEver: 25,
      isCurrentUser: true,
    },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchResort", () => {
  it("parses and returns GetResortResponse on 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResortResponse),
      })
    );
    const result = await fetchResort();
    expect(result).toEqual(mockResortResponse);
    const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toContain("/resort");
    expect((options as RequestInit).credentials).toBe("include");
  });

  it("throws Error('NOT_FOUND') on 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(fetchResort()).rejects.toThrow("NOT_FOUND");
  });

  it("throws on 500", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(fetchResort()).rejects.toThrow("HTTP 500");
  });
});

describe("postTick", () => {
  it("sends credentials and returns { ok: true }", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await postTick();

    expect(result).toEqual({ ok: true });
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.credentials).toBe("include");
  });
});

describe("postBuyLift", () => {
  it("sends correct body without guestId", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResortResponse),
    });
    vi.stubGlobal("fetch", mockFetch);

    await postBuyLift({ liftModelKey: "magic_carpet" });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(options.body as string)).toEqual({ liftModelKey: "magic_carpet" });
    expect(options.credentials).toBe("include");
  });
});

describe("postRepairLift", () => {
  it("sends correct body without guestId", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResortResponse),
    });
    vi.stubGlobal("fetch", mockFetch);

    await postRepairLift({ liftId: "lift-1" });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(options.body as string)).toEqual({ liftId: "lift-1" });
    expect(options.credentials).toBe("include");
  });
});

describe("fetchResortRanking", () => {
  it("parses and returns resort ranking on 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockRankingResponse),
      })
    );

    const result = await fetchResortRanking();

    expect(result).toEqual(mockRankingResponse);
    const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit | undefined];
    expect(url).toContain("/ranking");
    expect((options as RequestInit).credentials).toBe("include");
  });

  it("includes response body when ranking request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve("Cannot GET /api/ranking"),
      })
    );

    await expect(fetchResortRanking()).rejects.toThrow("HTTP 404: Cannot GET /api/ranking");
  });
});
