const BASE = import.meta.env.VITE_API_URL ?? "";

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch(`${BASE}/api/profile/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
}
