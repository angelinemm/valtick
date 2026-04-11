import type { UserDTO, LoginRequest, LoginResponse } from "@val-tick/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export async function fetchMe(): Promise<UserDTO | null> {
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.user;
}

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}
