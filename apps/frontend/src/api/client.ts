import type {
  GetResortResponse,
  MutationResortResponse,
  TickResponse,
  TickRequest,
  BuyLiftRequest,
  RepairLiftRequest,
  ResetResortRequest,
} from "@val-tick/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export async function fetchResort(guestId: string): Promise<GetResortResponse> {
  const res = await fetch(`${API_BASE}/resort/${guestId}`);
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function postTick(guestId: string): Promise<TickResponse> {
  const body: TickRequest = { guestId };
  const res = await fetch(`${API_BASE}/tick`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function postBuyLift(
  req: BuyLiftRequest
): Promise<MutationResortResponse> {
  const res = await fetch(`${API_BASE}/buy_lift`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function postRepairLift(
  req: RepairLiftRequest
): Promise<MutationResortResponse> {
  const res = await fetch(`${API_BASE}/repair_lift`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function postResetResort(
  req: ResetResortRequest
): Promise<MutationResortResponse> {
  const res = await fetch(`${API_BASE}/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
