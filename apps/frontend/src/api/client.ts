import type {
  GetResortResponse,
  MutationResortResponse,
  TickResponse,
  BuyLiftRequest,
  RepairLiftRequest,
} from "@val-tick/shared";

const BASE = import.meta.env.VITE_API_URL ?? "";

export async function fetchResort(): Promise<GetResortResponse> {
  const res = await fetch(`${BASE}/api/resort`, { credentials: "include" });
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function postTick(): Promise<TickResponse> {
  const res = await fetch(`${BASE}/api/tick`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function postBuyLift(req: BuyLiftRequest): Promise<MutationResortResponse> {
  const res = await fetch(`${BASE}/api/buy_lift`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function postRepairLift(req: RepairLiftRequest): Promise<MutationResortResponse> {
  const res = await fetch(`${BASE}/api/repair_lift`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function postResetResort(): Promise<MutationResortResponse> {
  const res = await fetch(`${BASE}/api/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
