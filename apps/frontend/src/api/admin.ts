import type {
  AdminUserDTO,
  CreateAdminUserRequest,
  CreateAdminUserResponse,
  ResetPasswordResponse,
} from "@val-tick/shared";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export async function fetchAdminUsers(): Promise<AdminUserDTO[]> {
  const res = await fetch(`${BASE}/admin/users`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.users;
}

export async function createAdminUser(
  body: CreateAdminUserRequest
): Promise<CreateAdminUserResponse> {
  const res = await fetch(`${BASE}/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function adminResetPassword(userId: string): Promise<ResetPasswordResponse> {
  const res = await fetch(`${BASE}/admin/users/${userId}/reset-password`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function adminResetResort(userId: string): Promise<void> {
  const res = await fetch(`${BASE}/admin/users/${userId}/reset-resort`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
